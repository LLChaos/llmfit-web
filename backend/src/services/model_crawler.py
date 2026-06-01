"""Model crawler — fetches LLM metadata from HuggingFace and upserts into PostgreSQL.

Architecture:
    Pure transformation functions + a single orchestrator (crawl_models)
    that receives a SQLAlchemy Session. The Session lifecycle is managed
    by the CLI layer (scripts/crawl_models.py), keeping DB access
    separate from business logic per CLAUDE.md.
"""

import logging
import math
import re
from datetime import datetime, timezone

from huggingface_hub import HfApi, hf_hub_download
from huggingface_hub.utils import HfHubHTTPError, RepositoryNotFoundError
from sqlalchemy.dialects.postgresql import insert as pg_insert

from src.models import Model
from src.utils.vram import estimate_vram_simple

logger = logging.getLogger(__name__)

# ── Config.json field extraction (robust fallback chains) ────────

_HIDDEN_DIM_KEYS = ("hidden_size", "d_model", "dim", "n_embd")
_NUM_LAYERS_KEYS = ("num_hidden_layers", "n_layers", "num_layers")
_CONTEXT_KEYS = ("max_position_embeddings", "n_positions", "n_ctx", "max_sequence_length")


def _extract_field(config: dict, keys: tuple[str, ...], label: str) -> int:
    """Extract an integer field from a model config using a fallback chain."""
    for key in keys:
        if key in config and isinstance(config[key], int) and config[key] > 0:
            return config[key]
    raise KeyError(f"Cannot determine {label} from config keys: {list(config)}")


def extract_hidden_dim(config: dict) -> int:
    return _extract_field(config, _HIDDEN_DIM_KEYS, "hidden_dim")


def extract_num_layers(config: dict) -> int:
    return _extract_field(config, _NUM_LAYERS_KEYS, "num_layers")


def extract_context_length(config: dict) -> int:
    return _extract_field(config, _CONTEXT_KEYS, "context_length")


# ── GGUF filename parsing ────────────────────────────────────────

# Matches patterns like "q4_k_m", "q8_0", "f16" in GGUF filenames
_GGUF_QUANT_PATTERN = re.compile(
    r"(?i)(?P<label>q[2-8]_[a-z0-9_]+|f16|fp16|f32|fp32)(?=\.gguf|$)"
)

_QUANT_BITS_MAP: dict[str, int] = {
    "q2": 2, "q3": 3, "q4": 4, "q5": 5, "q6": 6, "q8": 8,
    "f16": 16, "fp16": 16, "f32": 32, "fp32": 32,
}


def parse_gguf_quantization(filename: str) -> dict | None:
    """Extract quantization info from a GGUF filename.

    Returns:
        {"bits": 4, "label": "Q4_K_M"} or None if unrecognized.
    """
    match = _GGUF_QUANT_PATTERN.search(filename)
    if not match:
        return None

    raw_label = match.group("label").lower()
    prefix = raw_label[:2] if raw_label.startswith("q") else raw_label[:3]
    bits = _QUANT_BITS_MAP.get(prefix)
    if bits is None:
        return None

    return {"bits": bits, "label": raw_label.upper()}


# ── Slug generation ──────────────────────────────────────────────

def generate_model_slug(family: str, parameter_count_b: float, quantization: str) -> str:
    """Generate a deterministic, human-readable slug.

    Examples:
        ("Qwen", 8.0, "Q4_K_M")    → "qwen-8b-q4-k-m"
        ("Llama", 3.2, "FP16")      → "llama-3.2b-fp16"
        ("Phi", 0.6, "Q4_K_M")      → "phi-0.6b-q4-k-m"
    """
    family_part = family.lower().replace(" ", "-")
    size = f"{parameter_count_b:g}b"
    quant_part = quantization.lower().replace("_", "-")
    return f"{family_part}-{size}-{quant_part}"


# ── Quality estimation ───────────────────────────────────────────

def estimate_quality_from_hf(downloads: int, likes: int) -> int:
    """Derive a quality_score (30-95) from HuggingFace popularity metrics.

    Formula:
        dl_score  = min(65, log10(max(downloads, 1)) * 10)
        like_bonus = min(10, likes / 100)
        score      = clamp(int(dl_score + like_bonus), 30, 95)

    This is an automated baseline — manual curation can override it.
    """
    dl_score = min(80.0, math.log10(max(downloads, 1)) * 10.0)
    like_bonus = min(10.0, likes / 100.0)
    raw = int(dl_score + like_bonus)
    return max(30, min(95, raw))


# ── Record assembly ──────────────────────────────────────────────

def build_model_record(
    repo_id: str,
    author: str,
    model_name: str,
    parameter_count_b: float,
    config: dict,
    quant: dict,
    downloads: int,
    likes: int,
) -> dict:
    """Assemble a complete model record dict matching the ORM schema.

    Every field is explicitly assigned — no implicit or positional mapping.
    """
    quant_label = quant["label"]
    quant_bits = quant["bits"]
    slug = generate_model_slug(author, parameter_count_b, quant_label)

    vram_gb = estimate_vram_simple(parameter_count_b, quant_bits)

    try:
        hidden_dim = extract_hidden_dim(config)
    except KeyError:
        hidden_dim = 0
    try:
        num_layers = extract_num_layers(config)
    except KeyError:
        num_layers = 0
    try:
        context_length = extract_context_length(config)
    except KeyError:
        context_length = 4096

    display_name = f"{author} {model_name} {quant_label}"

    return {
        "slug": slug,
        "family": author,
        "name": display_name,
        "parameter_count_b": round(parameter_count_b, 2),
        "quantization": quant_label,
        "quantization_bits": quant_bits,
        "min_vram_gb": round(vram_gb * 0.7, 1),
        "recommended_vram_gb": round(vram_gb, 1),
        "context_length": context_length,
        "hidden_dim": hidden_dim,
        "num_layers": num_layers,
        "quality_score": estimate_quality_from_hf(downloads, likes),
        "download_url": f"https://huggingface.co/{repo_id}",
        "huggingface_repo": repo_id,
    }


# ── HF API fetching ──────────────────────────────────────────────

def fetch_gguf_quantizations(
    api: HfApi, repo_id: str, token: str | None = None
) -> list[dict]:
    """List GGUF quantization variants available in a HuggingFace repo."""
    try:
        info = api.repo_info(
            repo_id, files_metadata=True, token=token,
        )
    except (RepositoryNotFoundError, HfHubHTTPError):
        logger.debug("Skipping %s — repo not accessible", repo_id)
        return []

    quants: list[dict] = []
    seen: set[str] = set()
    for sibling in info.siblings:
        if not sibling.rfilename.endswith(".gguf"):
            continue
        parsed = parse_gguf_quantization(sibling.rfilename)
        if parsed is None:
            continue
        key = parsed["label"]
        if key not in seen:
            seen.add(key)
            quants.append(parsed)

    return quants


def _estimate_param_count_from_config(config: dict) -> float | None:
    """Try to extract parameter count from config."""
    # Some configs have explicit param count keys
    for key in ("num_parameters", "n_params", "num_params"):
        if key in config:
            val = config[key]
            if isinstance(val, (int, float)) and val > 0:
                return float(val) / 1e9  # raw count → billions
    return None


# ── Main orchestrator ────────────────────────────────────────────

def crawl_models(
    session,
    *,
    limit: int = 50,
    min_downloads: int = 10000,
    families: list[str] | None = None,
    token: str | None = None,
    dry_run: bool = False,
) -> int:
    """Fetch models from HuggingFace and upsert into the database.

    Args:
        session: SQLAlchemy Session (caller manages lifecycle).
        limit: Max models to fetch from HF.
        min_downloads: Popularity threshold.
        families: Optional list of author/org names to filter.
        token: Optional HF API token for higher rate limits.
        dry_run: If True, log records without writing to DB.

    Returns:
        Number of model-variant records processed.
    """
    api = HfApi(token=token)
    now = datetime.now(timezone.utc)
    count = 0

    logger.info(
        "Fetching up to %d models from HF (min %d downloads)...",
        limit, min_downloads,
    )

    try:
        models_iter = api.list_models(
            pipeline_tag="text-generation",
            sort="downloads",
            limit=limit,
            fetch_config=True,
            token=token,
        )
    except HfHubHTTPError as exc:
        logger.error("HF API error: %s", exc)
        return 0

    for model_info in models_iter:
        # ── Filtering ──────────────────────────────────────────
        if model_info.downloads is not None and model_info.downloads < min_downloads:
            continue
        if model_info.gated or model_info.private:
            continue

        author = model_info.author or "unknown"
        if families and author.lower() not in [f.lower() for f in families]:
            continue

        # ── Parameter count ────────────────────────────────────
        if model_info.config and isinstance(model_info.config, dict):
            config = model_info.config
        else:
            try:
                config_path = hf_hub_download(
                    model_info.id, "config.json", token=token,
                )
                import json
                with open(config_path, encoding="utf-8") as f:
                    config = json.load(f)
            except Exception:
                logger.debug("Skipping %s — cannot load config.json", model_info.id)
                continue

        param_b = _estimate_param_count_from_config(config)
        if param_b is None:
            logger.debug("Skipping %s — cannot determine parameter count", model_info.id)
            continue

        # ── Quantization variants ──────────────────────────────
        quants = fetch_gguf_quantizations(api, model_info.id, token=token)
        if not quants:
            # Fallback: create a single FP16 record
            quants = [{"bits": 16, "label": "FP16"}]

        downloads = model_info.downloads or 0
        likes = model_info.likes or 0
        model_name = model_info.id.split("/")[-1] if "/" in model_info.id else model_info.id

        for quant in quants:
            record = build_model_record(
                repo_id=model_info.id,
                author=author,
                model_name=model_name,
                parameter_count_b=param_b,
                config=config,
                quant=quant,
                downloads=downloads,
                likes=likes,
            )

            if dry_run:
                logger.info(
                    "  [DRY-RUN] %s | Q=%d | VRAM=%.1fGB | ctx=%d",
                    record["slug"], record["quality_score"],
                    record["recommended_vram_gb"], record["context_length"],
                )
            else:
                stmt = (
                    pg_insert(Model)
                    .values(**record, created_at=now, updated_at=now)
                    .on_conflict_do_update(
                        index_elements=[Model.slug],
                        set_={
                            "name": record["name"],
                            "parameter_count_b": record["parameter_count_b"],
                            "quantization": record["quantization"],
                            "quantization_bits": record["quantization_bits"],
                            "min_vram_gb": record["min_vram_gb"],
                            "recommended_vram_gb": record["recommended_vram_gb"],
                            "context_length": record["context_length"],
                            "hidden_dim": record["hidden_dim"],
                            "num_layers": record["num_layers"],
                            "quality_score": record["quality_score"],
                            "download_url": record["download_url"],
                            "huggingface_repo": record["huggingface_repo"],
                            "updated_at": now,
                        },
                    )
                )
                session.execute(stmt)
            count += 1

    if not dry_run:
        session.commit()

    logger.info("Processed %d model-variant records.", count)
    return count

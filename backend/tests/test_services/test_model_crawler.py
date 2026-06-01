"""Tests for model crawler — pure transformation functions (no network)."""

import pytest
from src.services.model_crawler import (
    extract_hidden_dim,
    extract_num_layers,
    extract_context_length,
    parse_gguf_quantization,
    generate_model_slug,
    estimate_quality_from_hf,
    build_model_record,
)


class TestConfigExtraction:
    def test_extract_hidden_size(self) -> None:
        config = {"hidden_size": 4096}
        assert extract_hidden_dim(config) == 4096

    def test_extract_d_model_fallback(self) -> None:
        config = {"d_model": 768}
        assert extract_hidden_dim(config) == 768

    def test_extract_dim_fallback(self) -> None:
        config = {"dim": 512}
        assert extract_hidden_dim(config) == 512

    def test_extract_n_embd_fallback(self) -> None:
        config = {"n_embd": 256}
        assert extract_hidden_dim(config) == 256

    def test_extract_first_match_wins(self) -> None:
        config = {"hidden_size": 4096, "d_model": 768}
        assert extract_hidden_dim(config) == 4096

    def test_extract_raises_if_none_found(self) -> None:
        with pytest.raises(KeyError):
            extract_hidden_dim({})

    def test_extract_skips_zero_values(self) -> None:
        config = {"hidden_size": 0, "d_model": 768}
        assert extract_hidden_dim(config) == 768

    def test_extract_num_layers(self) -> None:
        config = {"num_hidden_layers": 32}
        assert extract_num_layers(config) == 32

    def test_extract_num_layers_fallback(self) -> None:
        config = {"n_layers": 24}
        assert extract_num_layers(config) == 24

    def test_extract_context_length(self) -> None:
        config = {"max_position_embeddings": 32768}
        assert extract_context_length(config) == 32768

    def test_extract_context_n_positions(self) -> None:
        config = {"n_positions": 2048}
        assert extract_context_length(config) == 2048


class TestParseGgufQuantization:
    def test_q4_k_m(self) -> None:
        result = parse_gguf_quantization("qwen3-8b-q4_k_m.gguf")
        assert result == {"bits": 4, "label": "Q4_K_M"}

    def test_q8_0(self) -> None:
        result = parse_gguf_quantization("model-q8_0.gguf")
        assert result == {"bits": 8, "label": "Q8_0"}

    def test_fp16(self) -> None:
        result = parse_gguf_quantization("model-f16.gguf")
        assert result == {"bits": 16, "label": "F16"}

    def test_uppercase(self) -> None:
        result = parse_gguf_quantization("MODEL-Q4_K_M.GGUF")
        assert result == {"bits": 4, "label": "Q4_K_M"}

    def test_not_gguf_returns_none(self) -> None:
        assert parse_gguf_quantization("model.safetensors") is None

    def test_no_quant_pattern_returns_none(self) -> None:
        assert parse_gguf_quantization("readme.md") is None


class TestGenerateModelSlug:
    def test_billion_params(self) -> None:
        slug = generate_model_slug("Qwen", 8.0, "Q4_K_M")
        assert slug == "qwen-8b-q4-k-m"

    def test_fractional_params(self) -> None:
        slug = generate_model_slug("Llama", 3.2, "FP16")
        assert slug == "llama-3.2b-fp16"

    def test_sub_billion_params(self) -> None:
        slug = generate_model_slug("Phi", 0.6, "Q4_K_M")
        assert slug == "phi-0.6b-q4-k-m"

    def test_spaces_in_family(self) -> None:
        slug = generate_model_slug("DeepSeek R1", 7.0, "Q8_0")
        assert slug == "deepseek-r1-7b-q8-0"


class TestEstimateQuality:
    def test_high_downloads(self) -> None:
        score = estimate_quality_from_hf(downloads=10_000_000, likes=5000)
        assert 75 <= score <= 90

    def test_low_downloads(self) -> None:
        score = estimate_quality_from_hf(downloads=100, likes=0)
        assert 30 <= score <= 60

    def test_zero_downloads(self) -> None:
        score = estimate_quality_from_hf(downloads=0, likes=0)
        assert score == 30  # floor

    def test_clamped_to_95(self) -> None:
        score = estimate_quality_from_hf(downloads=100_000_000, likes=10000)
        assert 85 <= score <= 95


class TestBuildModelRecord:
    def test_basic_record(self) -> None:
        config = {
            "hidden_size": 4096,
            "num_hidden_layers": 32,
            "max_position_embeddings": 32768,
        }
        quant = {"bits": 4, "label": "Q4_K_M"}
        record = build_model_record(
            repo_id="Qwen/Qwen3-8B-GGUF",
            author="Qwen",
            model_name="Qwen3-8B",
            parameter_count_b=8.0,
            config=config,
            quant=quant,
            downloads=5_000_000,
            likes=2000,
        )
        assert record["slug"] == "qwen-8b-q4-k-m"
        assert record["family"] == "Qwen"
        assert record["parameter_count_b"] == 8.0
        assert record["quantization"] == "Q4_K_M"
        assert record["quantization_bits"] == 4
        assert record["context_length"] == 32768
        assert record["hidden_dim"] == 4096
        assert record["num_layers"] == 32
        assert record["recommended_vram_gb"] > 0
        assert record["min_vram_gb"] > 0
        assert record["min_vram_gb"] < record["recommended_vram_gb"]
        assert record["huggingface_repo"] == "Qwen/Qwen3-8B-GGUF"
        assert "huggingface.co" in record["download_url"]
        assert 30 <= record["quality_score"] <= 95

    def test_missing_architecture_fields_use_defaults(self) -> None:
        config: dict = {}
        quant = {"bits": 8, "label": "Q8_0"}
        record = build_model_record(
            repo_id="org/model",
            author="Org",
            model_name="Model",
            parameter_count_b=7.0,
            config=config,
            quant=quant,
            downloads=1000,
            likes=10,
        )
        assert record["hidden_dim"] == 0
        assert record["num_layers"] == 0
        assert record["context_length"] == 4096  # default

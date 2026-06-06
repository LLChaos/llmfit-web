"""Tests for GPU Mapper service."""

import pytest
from src.services.gpu_mapper import GpuMapper, GpuMappingError, normalize_gpu_name
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.utils.gpu_name import token_overlap_score


@pytest.fixture
def gpu_repo(data_dir):
    return JsonGpuRepository(data_dir / "mock_gpu_specs.json")


@pytest.fixture
def gpu_mapper(gpu_repo):
    return GpuMapper(gpu_repo)


class TestGpuMapper:
    def test_map_exact_gpu_name_returns_full_spec(self, gpu_mapper) -> None:
        """Exact GPU name should return complete spec dict."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 3060")
        assert result is not None
        assert result["name"] == "NVIDIA GeForce RTX 3060"
        assert result["vram_gb"] == 12.0
        assert result["tier"] == "mid"
        assert result["vendor"] == "nvidia"
        assert result["flops_tflops"] is not None

    def test_map_fuzzy_name_finds_closest_match(self, gpu_mapper) -> None:
        """Partial/fuzzy name should still resolve via find_closest_match."""
        result = gpu_mapper.map("RTX 4090")
        assert result is not None
        assert "4090" in result["name"]

    def test_map_unknown_gpu_returns_fallback(self, gpu_mapper) -> None:
        """Completely unknown GPU name should return a conservative fallback."""
        result = gpu_mapper.map("FakeGPU XYZ-9999")
        assert result is not None
        assert result["vendor"] == "unknown"
        assert result["vram_gb"] == 4.0
        assert result["tier"] == "entry"
        assert result["flops_tflops"] is None
        assert result["memory_bandwidth_gb_s"] is None

    def test_map_empty_string_raises_error(self, gpu_mapper) -> None:
        """Empty GPU name should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("")

    def test_map_whitespace_string_raises_error(self, gpu_mapper) -> None:
        """Whitespace-only string should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("   ")

    def test_map_preserves_all_required_fields(self, gpu_mapper) -> None:
        """Mapped GPU must contain all fields needed by downstream scorers."""
        result = gpu_mapper.map("RTX 3060")
        required_fields = [
            "name", "vram_gb", "tier", "vendor",
            "benchmark_score", "flops_tflops", "memory_bandwidth_gb_s",
        ]
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"

    def test_map_laptop_gpu_resolves_to_mobile(self, gpu_mapper) -> None:
        """WebGL 'Laptop GPU' name → normalize → match 'Mobile' entry.

        After normalization the query becomes 'GeForce RTX 4080 Mobile',
        which substring-matches the mock-data entry
        'NVIDIA GeForce RTX 4080 Mobile'."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 4080 Laptop GPU")
        assert result is not None
        assert "4080" in result["name"]
        assert "Mobile" in result["name"]
        assert result["vram_gb"] == 12.0  # mobile spec, not desktop 16GB
        assert result["vendor"] == "nvidia"

    def test_map_notebook_gpu_resolves_to_mobile(self, gpu_mapper) -> None:
        """'Notebook GPU' suffix should also resolve to 'Mobile' entry."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 4080 Notebook GPU")
        assert result is not None
        assert "Mobile" in result["name"]
        assert result["vram_gb"] == 12.0

    def test_map_desktop_gpu_still_works(self, gpu_mapper) -> None:
        """Desktop GPU names (without mobile suffix) should still match."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 4090")
        assert result is not None
        assert "4090" in result["name"]
        assert result["vram_gb"] == 24.0


class TestNormalizeGpuName:
    def test_laptop_gpu_becomes_mobile(self) -> None:
        """Vendor prefix stripped + 'Laptop GPU' → 'Mobile'."""
        assert normalize_gpu_name("NVIDIA GeForce RTX 4080 Laptop GPU") == \
            "GeForce RTX 4080 Mobile"

    def test_notebook_gpu_becomes_mobile(self) -> None:
        assert normalize_gpu_name("NVIDIA GeForce RTX 4080 Notebook GPU") == \
            "GeForce RTX 4080 Mobile"

    def test_case_insensitive(self) -> None:
        assert normalize_gpu_name("NVIDIA GeForce RTX 4080 laptop gpu") == \
            "GeForce RTX 4080 Mobile"

    def test_laptop_without_space(self) -> None:
        """Some WebGL strings may have 'LaptopGPU' without space."""
        assert normalize_gpu_name("NVIDIA GeForce RTX 4080 LaptopGPU") == \
            "GeForce RTX 4080 Mobile"

    def test_desktop_gpu_strips_vendor(self) -> None:
        """Desktop GPU: vendor prefix stripped, model name preserved."""
        assert normalize_gpu_name("NVIDIA GeForce RTX 4090") == \
            "GeForce RTX 4090"

    def test_amd_gpu_strips_vendor(self) -> None:
        assert normalize_gpu_name("AMD Radeon RX 7900 XTX") == \
            "Radeon RX 7900 XTX"

    def test_no_vendor_prefix_unchanged(self) -> None:
        """Names without recognized vendor prefixes pass through."""
        assert normalize_gpu_name("GeForce RTX 4080 Mobile") == \
            "GeForce RTX 4080 Mobile"

    def test_apple_silicon_unchanged(self) -> None:
        """Apple Silicon should be unchanged (no vendor prefix to strip)."""
        assert normalize_gpu_name("Apple M1 Pro") == \
            "Apple M1 Pro"

    def test_empty_string(self) -> None:
        assert normalize_gpu_name("") == ""

    def test_whitespace_only(self) -> None:
        assert normalize_gpu_name("   ") == ""


class TestTokenOverlapScore:
    def test_exact_token_match(self) -> None:
        """Same model number + family → perfect score."""
        score = token_overlap_score(
            "NVIDIA GeForce RTX 4080 Laptop GPU",
            "NVIDIA GeForce RTX 4080 Mobile",
        )
        assert score == 1.0

    def test_different_model_no_match(self) -> None:
        """Different model numbers → at or below threshold (0.5).
        Both share 'rtx' but have different model numbers, so they
        land exactly at 0.5 — the boundary where we stop matching."""
        score = token_overlap_score(
            "NVIDIA GeForce RTX 4080",
            "NVIDIA GeForce RTX 4090",
        )
        assert score == 0.5

    def test_same_family_different_number(self) -> None:
        """Same GPU family but different model → partial overlap."""
        score = token_overlap_score(
            "NVIDIA GeForce RTX 4080",
            "NVIDIA GeForce RTX 4070",
        )
        # Both share "rtx" token, but have different numbers
        assert 0.0 < score < 1.0

    def test_completely_unrelated(self) -> None:
        score = token_overlap_score("FakeGPU XYZ-9999", "NVIDIA GeForce RTX 4080")
        assert score == 0.0

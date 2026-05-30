"""Tests for JsonGpuRepository."""

import pytest
from pathlib import Path
from src.repositories.json_gpu_repository import JsonGpuRepository


@pytest.fixture
def gpu_repo(data_dir: Path) -> JsonGpuRepository:
    return JsonGpuRepository(data_dir / "mock_gpu_specs.json")


class TestJsonGpuRepository:
    def test_get_all_returns_all_gpus(self, gpu_repo: JsonGpuRepository) -> None:
        all_gpus = gpu_repo.get_all()
        assert len(all_gpus) == 29
        assert all(isinstance(g, dict) for g in all_gpus)
        assert all("name" in g for g in all_gpus)

    def test_get_by_name_exact_match(self, gpu_repo: JsonGpuRepository) -> None:
        gpu = gpu_repo.get_by_name("NVIDIA GeForce RTX 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0
        assert gpu["tier"] == "mid"

    def test_get_by_name_case_insensitive(self, gpu_repo: JsonGpuRepository) -> None:
        gpu = gpu_repo.get_by_name("nvidia geforce rtx 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0

    def test_get_by_name_not_found(self, gpu_repo: JsonGpuRepository) -> None:
        assert gpu_repo.get_by_name("Fake GPU 9000") is None

    def test_find_closest_match_substring(self, gpu_repo: JsonGpuRepository) -> None:
        gpu = gpu_repo.find_closest_match("RTX 4090")
        assert gpu is not None
        assert "4090" in gpu["name"]

    def test_find_closest_match_empty_string(self, gpu_repo: JsonGpuRepository) -> None:
        assert gpu_repo.find_closest_match("") is None

    def test_find_closest_match_unknown(self, gpu_repo: JsonGpuRepository) -> None:
        assert gpu_repo.find_closest_match("CompletelyUnknownGPU") is None

    def test_get_by_tier(self, gpu_repo: JsonGpuRepository) -> None:
        mid_gpus = gpu_repo.get_by_tier("mid")
        assert len(mid_gpus) > 0
        assert all(g["tier"] == "mid" for g in mid_gpus)

    def test_get_next_tier_gpus_from_entry(self, gpu_repo: JsonGpuRepository) -> None:
        next_tier = gpu_repo.get_next_tier_gpus("entry")
        assert len(next_tier) > 0
        assert all(g["tier"] in ("mid", "high", "enthusiast") for g in next_tier)

    def test_get_next_tier_gpus_from_enthusiast(self, gpu_repo: JsonGpuRepository) -> None:
        next_tier = gpu_repo.get_next_tier_gpus("enthusiast")
        assert len(next_tier) == 0

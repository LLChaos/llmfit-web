"""Tests for JsonModelRepository."""

import pytest
from pathlib import Path
from src.repositories.json_model_repository import JsonModelRepository


@pytest.fixture
def model_repo(data_dir: Path) -> JsonModelRepository:
    return JsonModelRepository(data_dir / "mock_models.json")


class TestJsonModelRepository:
    def test_get_all_paginated(self, model_repo: JsonModelRepository) -> None:
        result = model_repo.get_all(page=1, size=10)
        assert "items" in result
        assert "total" in result
        assert result["page"] == 1
        assert result["size"] == 10
        assert len(result["items"]) <= 10
        assert result["total"] >= len(result["items"])

    def test_get_all_second_page_disjoint(self, model_repo: JsonModelRepository) -> None:
        page1 = model_repo.get_all(page=1, size=10)
        page2 = model_repo.get_all(page=2, size=10)
        page1_ids = {m["id"] for m in page1["items"]}
        page2_ids = {m["id"] for m in page2["items"]}
        assert page1_ids.isdisjoint(page2_ids)

    def test_get_by_id_found(self, model_repo: JsonModelRepository) -> None:
        model = model_repo.get_by_id("qwen3-8b-q4-k-m")
        assert model is not None
        assert model["family"] == "Qwen"
        assert model["parameter_count_b"] == 8.0

    def test_get_by_id_not_found(self, model_repo: JsonModelRepository) -> None:
        assert model_repo.get_by_id("nonexistent-model") is None

    def test_get_by_family(self, model_repo: JsonModelRepository) -> None:
        qwen_models = model_repo.get_by_family("Qwen")
        assert len(qwen_models) > 0
        assert all(m["family"] == "Qwen" for m in qwen_models)

    def test_get_by_family_case_insensitive(self, model_repo: JsonModelRepository) -> None:
        qwen_models = model_repo.get_by_family("qwen")
        assert len(qwen_models) > 0

    def test_get_runnable_models(self, model_repo: JsonModelRepository) -> None:
        runnable = model_repo.get_runnable_models(6.0)
        assert len(runnable) > 0
        assert all(m["recommended_vram_gb"] <= 6.0 for m in runnable)

    def test_get_runnable_models_none(self, model_repo: JsonModelRepository) -> None:
        runnable = model_repo.get_runnable_models(0.1)
        assert len(runnable) == 0

    def test_get_all_with_family_filter(self, model_repo: JsonModelRepository) -> None:
        result = model_repo.get_all(family="Llama")
        assert result["total"] > 0
        assert all(m["family"] == "Llama" for m in result["items"])

    def test_total_models_is_50(self, model_repo: JsonModelRepository) -> None:
        result = model_repo.get_all(size=100)
        assert result["total"] == 50

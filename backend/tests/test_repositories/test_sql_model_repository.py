"""Tests for SqlModelRepository using SQLite in-memory."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.models import Base, Model
from src.repositories.sql_model_repository import SqlModelRepository


@pytest.fixture
def sqlite_session():
    """In-memory SQLite session with tables created."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def seeded(sqlite_session):
    """Return a repo seeded with 5 test models."""
    repo = SqlModelRepository(sqlite_session)
    records = [
        Model(
            slug="alpha-8b-q4",
            family="Alpha",
            name="Alpha 8B Q4_K_M",
            parameter_count_b=8.0,
            quantization="Q4_K_M",
            quantization_bits=4,
            min_vram_gb=4.8,
            recommended_vram_gb=6.8,
            context_length=32768,
            hidden_dim=4096,
            num_layers=32,
            quality_score=80,
            download_url="https://hf.co/alpha",
            huggingface_repo="org/alpha",
        ),
        Model(
            slug="beta-4b-q4",
            family="Beta",
            name="Beta 4B Q4_K_M",
            parameter_count_b=4.0,
            quantization="Q4_K_M",
            quantization_bits=4,
            min_vram_gb=2.4,
            recommended_vram_gb=3.4,
            context_length=8192,
            hidden_dim=2560,
            num_layers=36,
            quality_score=68,
            download_url="https://hf.co/beta",
            huggingface_repo="org/beta",
        ),
        Model(
            slug="alpha-8b-q8",
            family="Alpha",
            name="Alpha 8B Q8_0",
            parameter_count_b=8.0,
            quantization="Q8_0",
            quantization_bits=8,
            min_vram_gb=9.2,
            recommended_vram_gb=11.2,
            context_length=32768,
            hidden_dim=4096,
            num_layers=32,
            quality_score=82,
            download_url="https://hf.co/alpha",
            huggingface_repo="org/alpha",
        ),
        Model(
            slug="gamma-14b-q4",
            family="Gamma",
            name="Gamma 14B Q4_K_M",
            parameter_count_b=14.0,
            quantization="Q4_K_M",
            quantization_bits=4,
            min_vram_gb=8.4,
            recommended_vram_gb=11.9,
            context_length=32768,
            hidden_dim=5120,
            num_layers=40,
            quality_score=84,
            download_url="https://hf.co/gamma",
            huggingface_repo="org/gamma",
        ),
        Model(
            slug="delta-0.6b-q4",
            family="Delta",
            name="Delta 0.6B Q4_K_M",
            parameter_count_b=0.6,
            quantization="Q4_K_M",
            quantization_bits=4,
            min_vram_gb=0.8,
            recommended_vram_gb=1.2,
            context_length=32768,
            hidden_dim=1024,
            num_layers=28,
            quality_score=42,
            download_url="https://hf.co/delta",
            huggingface_repo="org/delta",
        ),
    ]
    for r in records:
        sqlite_session.add(r)
    sqlite_session.commit()
    return repo


class TestSqlModelRepository:
    def test_get_all_returns_paginated(self, seeded: SqlModelRepository) -> None:
        result = seeded.get_all(page=1, size=2)
        assert result["page"] == 1
        assert result["size"] == 2
        assert result["total"] == 5
        assert len(result["items"]) == 2

    def test_get_all_second_page_disjoint(self, seeded: SqlModelRepository) -> None:
        page1 = seeded.get_all(page=1, size=2)
        page2 = seeded.get_all(page=2, size=2)
        page3 = seeded.get_all(page=3, size=2)
        ids_p1 = {m["id"] for m in page1["items"]}
        ids_p2 = {m["id"] for m in page2["items"]}
        ids_p3 = {m["id"] for m in page3["items"]}
        assert ids_p1.isdisjoint(ids_p2)
        assert ids_p2.isdisjoint(ids_p3)
        assert len(page3["items"]) == 1  # 5 total, 2 per page

    def test_get_by_id_found(self, seeded: SqlModelRepository) -> None:
        model = seeded.get_by_id("alpha-8b-q4")
        assert model is not None
        assert model["family"] == "Alpha"
        assert model["parameter_count_b"] == 8.0

    def test_get_by_id_not_found(self, seeded: SqlModelRepository) -> None:
        assert seeded.get_by_id("nonexistent") is None

    def test_get_by_family(self, seeded: SqlModelRepository) -> None:
        alphas = seeded.get_by_family("Alpha")
        assert len(alphas) == 2
        families = {m["family"] for m in alphas}
        assert families == {"Alpha"}

    def test_get_by_family_case_insensitive(self, seeded: SqlModelRepository) -> None:
        result = seeded.get_by_family("ALPHA")
        assert len(result) == 2

    def test_get_runnable_models(self, seeded: SqlModelRepository) -> None:
        runnable = seeded.get_runnable_models(max_vram_gb=6.0)
        slugs = {m["id"] for m in runnable}
        # alpha-8b-q4: recommended_vram=6.8 > 6.0 → NOT runnable
        assert "alpha-8b-q4" not in slugs
        # alpha-8b-q8: recommended_vram=11.2 > 6.0 → NOT runnable
        assert "alpha-8b-q8" not in slugs
        assert "beta-4b-q4" in slugs     # 3.4 <= 6.0
        assert "delta-0.6b-q4" in slugs  # 1.2 <= 6.0

    def test_get_runnable_models_all(self, seeded: SqlModelRepository) -> None:
        runnable = seeded.get_runnable_models(max_vram_gb=50.0)
        assert len(runnable) == 5

    def test_get_runnable_models_none(self, seeded: SqlModelRepository) -> None:
        runnable = seeded.get_runnable_models(max_vram_gb=0.5)
        assert len(runnable) == 0

    def test_returned_dict_has_id_as_slug(self, seeded: SqlModelRepository) -> None:
        model = seeded.get_by_id("alpha-8b-q4")
        assert model["id"] == "alpha-8b-q4"
        assert "family" in model
        assert "quantization_bits" in model

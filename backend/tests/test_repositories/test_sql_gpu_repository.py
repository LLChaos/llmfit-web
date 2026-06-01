"""Tests for SqlGpuRepository using SQLite in-memory."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.models import Base, GpuSpec
from src.repositories.sql_gpu_repository import SqlGpuRepository


@pytest.fixture
def sqlite_session():
    """In-memory SQLite session with tables created."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def seeded(sqlite_session):
    """Return a repo seeded with test GPUs."""
    repo = SqlGpuRepository(sqlite_session)
    records = [
        GpuSpec(
            slug="gpu-nvidia-gtx-1650-4gb",
            name="NVIDIA GeForce GTX 1650",
            vendor="nvidia",
            vram_gb=4.0,
            benchmark_score=7800,
            flops_tflops=2.98,
            memory_bandwidth_gb_s=128.0,
            tier="entry",
        ),
        GpuSpec(
            slug="gpu-nvidia-rtx-3060-12gb",
            name="NVIDIA GeForce RTX 3060",
            vendor="nvidia",
            vram_gb=12.0,
            benchmark_score=17000,
            flops_tflops=12.74,
            memory_bandwidth_gb_s=360.0,
            tier="mid",
        ),
        GpuSpec(
            slug="gpu-nvidia-rtx-4090-24gb",
            name="NVIDIA GeForce RTX 4090",
            vendor="nvidia",
            vram_gb=24.0,
            benchmark_score=38900,
            flops_tflops=82.58,
            memory_bandwidth_gb_s=1008.0,
            tier="high",
        ),
        GpuSpec(
            slug="gpu-nvidia-a100-80gb",
            name="NVIDIA A100",
            vendor="nvidia",
            vram_gb=80.0,
            benchmark_score=35000,
            flops_tflops=312.0,
            memory_bandwidth_gb_s=2039.0,
            tier="enthusiast",
        ),
        GpuSpec(
            slug="gpu-amd-rx-7900-xtx-24gb",
            name="AMD Radeon RX 7900 XTX",
            vendor="amd",
            vram_gb=24.0,
            benchmark_score=31000,
            flops_tflops=61.42,
            memory_bandwidth_gb_s=960.0,
            tier="high",
        ),
    ]
    for r in records:
        sqlite_session.add(r)
    sqlite_session.commit()
    return repo


class TestSqlGpuRepository:
    def test_get_all_returns_all(self, seeded: SqlGpuRepository) -> None:
        all_gpus = seeded.get_all()
        assert len(all_gpus) == 5

    def test_get_by_name_exact(self, seeded: SqlGpuRepository) -> None:
        gpu = seeded.get_by_name("NVIDIA GeForce RTX 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0
        assert gpu["tier"] == "mid"

    def test_get_by_name_case_insensitive(self, seeded: SqlGpuRepository) -> None:
        gpu = seeded.get_by_name("nvidia geforce rtx 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0

    def test_get_by_name_not_found(self, seeded: SqlGpuRepository) -> None:
        assert seeded.get_by_name("Nonexistent GPU") is None

    def test_find_closest_match_exact(self, seeded: SqlGpuRepository) -> None:
        gpu = seeded.find_closest_match("NVIDIA GeForce RTX 4090")
        assert gpu is not None
        assert gpu["vram_gb"] == 24.0

    def test_find_closest_match_substring(self, seeded: SqlGpuRepository) -> None:
        gpu = seeded.find_closest_match("RTX 3060")
        assert gpu is not None
        assert gpu["name"] == "NVIDIA GeForce RTX 3060"

    def test_find_closest_match_empty(self, seeded: SqlGpuRepository) -> None:
        assert seeded.find_closest_match("") is None

    def test_find_closest_match_unknown(self, seeded: SqlGpuRepository) -> None:
        assert seeded.find_closest_match("XYZ Unknown GPU Model 9000") is None

    def test_get_by_tier(self, seeded: SqlGpuRepository) -> None:
        highs = seeded.get_by_tier("high")
        assert len(highs) == 2
        tiers = {g["tier"] for g in highs}
        assert tiers == {"high"}

    def test_get_next_tier_from_entry(self, seeded: SqlGpuRepository) -> None:
        next_up = seeded.get_next_tier_gpus("entry")
        assert len(next_up) == 4  # mid, high, enthusiast

    def test_get_next_tier_from_enthusiast(self, seeded: SqlGpuRepository) -> None:
        next_up = seeded.get_next_tier_gpus("enthusiast")
        assert len(next_up) == 0

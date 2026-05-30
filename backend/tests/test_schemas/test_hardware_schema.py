"""Tests for hardware schemas."""

import pytest
from pydantic import ValidationError
from src.schemas.hardware import HardwareInput, GpuInfo, HardwareInfo


class TestHardwareInput:
    def test_valid_input(self) -> None:
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        assert hw.gpu_name == "NVIDIA GeForce RTX 3060"
        assert hw.ram_gb == 32.0
        assert hw.cpu_cores == 16
        assert hw.os == "Windows"

    def test_empty_gpu_name_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(gpu_name="", ram_gb=16, cpu_cores=8, os="Windows")

    def test_negative_ram_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(
                gpu_name="RTX 3060", ram_gb=-1, cpu_cores=8, os="Windows"
            )

    def test_zero_cpu_cores_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(
                gpu_name="RTX 3060", ram_gb=16, cpu_cores=0, os="Windows"
            )

    def test_camelcase_serialization(self) -> None:
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        data = hw.model_dump(by_alias=True)
        assert "gpuName" in data
        assert "ramGb" in data
        assert "cpuCores" in data


class TestHardwareInfo:
    def test_valid_info(self) -> None:
        info = HardwareInfo(
            gpu_name="RTX 3060",
            vram_gb=12.0,
            gpu_tier="mid",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        assert info.gpu_tier == "mid"
        assert info.vram_gb == 12.0

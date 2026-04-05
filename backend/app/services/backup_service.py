from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.schemas.common import BackupInfo


class BackupService:
    def __init__(self) -> None:
        self._backup_dir = settings.runtime_dir / "backups"
        self._backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self, data_dir: str) -> BackupInfo:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        archive_name = f"lobster-claw-backup-{timestamp}"
        target = self._backup_dir / archive_name
        Path(data_dir).mkdir(parents=True, exist_ok=True)

        shutil.make_archive(str(target), "zip", root_dir=data_dir)
        file_path = Path(f"{target}.zip")

        return BackupInfo(
            name=file_path.name,
            created_at=datetime.now(timezone.utc).isoformat(),
            size_bytes=file_path.stat().st_size,
        )

    def list_backups(self) -> list[BackupInfo]:
        result: list[BackupInfo] = []
        for item in sorted(self._backup_dir.glob("*.zip"), reverse=True):
            result.append(
                BackupInfo(
                    name=item.name,
                    created_at=datetime.fromtimestamp(item.stat().st_mtime, tz=timezone.utc).isoformat(),
                    size_bytes=item.stat().st_size,
                )
            )
        return result

    def restore_backup(self, backup_name: str, data_dir: str) -> tuple[bool, str]:
        source = self._backup_dir / backup_name
        if not source.exists():
            return False, "未找到指定备份文件。"

        target = Path(data_dir)
        target.mkdir(parents=True, exist_ok=True)
        shutil.unpack_archive(str(source), extract_dir=str(target))
        return True, "备份恢复成功。"

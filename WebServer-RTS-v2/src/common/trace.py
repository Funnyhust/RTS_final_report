import csv
import os
import threading
from typing import Dict, Optional


EVENT_FIELDS = [
    "msg_id",
    "device_id",
    "msg_type",
    "t_sensor_ms",
    "t_pc_rx_ms",
    "t_proc_start_ms",
    "t_proc_end_ms",
    "t_db_enqueue_ms",
    "t_dashboard_emit_ms",
    "deadline_ms",
    "avi_ms",
    "notes",
]

ACK_FIELDS = [
    "msg_id",
    "t_db_ack_ms",
]


class TraceWriter:
    def __init__(self, path: str, max_mb: int = 50) -> None:
        self.path = path
        self.max_bytes = max_mb * 1024 * 1024
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self._ensure_header()

    def _ensure_header(self) -> None:
        if not os.path.exists(self.path) or os.path.getsize(self.path) == 0:
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=EVENT_FIELDS)
                writer.writeheader()

    def write_event(self, row: Dict[str, object]) -> None:
        with self._lock:
            self._maybe_rotate()
            with open(self.path, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=EVENT_FIELDS)
                writer.writerow(row)

    def _maybe_rotate(self) -> None:
        if self.max_bytes <= 0:
            return
        if not os.path.exists(self.path):
            return
        if os.path.getsize(self.path) <= self.max_bytes:
            return

        # Rotate file when it exceeds max_bytes
        rotated = f"{self.path}.1"
        if os.path.exists(rotated):
            os.remove(rotated)
        os.rename(self.path, rotated)
        self._ensure_header()


class AckWriter:
    def __init__(self, path: str) -> None:
        self.path = path
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self._ensure_header()

    def _ensure_header(self) -> None:
        if not os.path.exists(self.path) or os.path.getsize(self.path) == 0:
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=ACK_FIELDS)
                writer.writeheader()

    def write_ack(self, msg_id: str, t_db_ack_ms: Optional[int]) -> None:
        ack_value = t_db_ack_ms if t_db_ack_ms is not None else -1
        with self._lock:
            with open(self.path, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=ACK_FIELDS)
                writer.writerow({"msg_id": msg_id, "t_db_ack_ms": ack_value})

import json
import os
import threading
import time
from typing import Dict

from src.common.time_utils import wall_ms
from src.rtdb.rtdb_interface import RTDBInterface


class MockBackend(RTDBInterface):
    def __init__(self, output_path: str, ack_delay_ms: int = 0) -> None:
        self.output_path = output_path
        self.ack_delay_ms = ack_delay_ms
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

    def _write_line(self, record: Dict[str, object]) -> None:
        with self._lock:
            with open(self.output_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")

    def write_state(self, device_id: str, state_dict: Dict[str, object]) -> int:
        self._write_line({"path": f"/devices/{device_id}/state", "data": state_dict})
        return self._ack()

    def write_alarm(self, alarm_id: str, alarm_dict: Dict[str, object]) -> int:
        self._write_line({"path": f"/alarms/{alarm_id}", "data": alarm_dict})
        return self._ack()

    def write_telemetry(self, device_id: str, telemetry_dict: Dict[str, object]) -> int:
        self._write_line({"path": f"/telemetry/{device_id}", "data": telemetry_dict})
        return self._ack()

    def healthcheck(self) -> bool:
        return True

    def _ack(self) -> int:
        if self.ack_delay_ms > 0:
            time.sleep(self.ack_delay_ms / 1000.0)
        return wall_ms()

import logging
import os
from typing import Dict, Optional

from src.common.time_utils import wall_ms
from src.rtdb.mock_backend import MockBackend
from src.rtdb.rtdb_interface import RTDBInterface

try:
    import firebase_admin
    from firebase_admin import credentials
    from firebase_admin import db
except Exception:  # pragma: no cover
    firebase_admin = None
    credentials = None
    db = None


class FirebaseBackend(RTDBInterface):
    def __init__(
        self,
        service_account_json: str,
        database_url: str,
        fallback: Optional[MockBackend] = None,
    ) -> None:
        self._logger = logging.getLogger("firebase")
        self._enabled = False
        self._fallback = fallback

        if firebase_admin is None:
            self._logger.warning("firebase_admin not installed, using mock backend")
            return

        if not os.path.exists(service_account_json):
            self._logger.warning("Service account key not found, using mock backend")
            return

        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(service_account_json)
                firebase_admin.initialize_app(cred, {"databaseURL": database_url})
            self._enabled = True
            self._logger.info("Firebase backend initialized")
        except Exception as exc:
            self._logger.warning("Firebase init failed, using mock backend: %s", exc)
            self._enabled = False

    def _ref(self, path: str):
        return db.reference(path)

    def write_state(self, device_id: str, state_dict: Dict[str, object]) -> int:
        if self._enabled:
            self._ref(f"/devices/{device_id}/state").update(state_dict)
            return wall_ms()
        return self._fallback.write_state(device_id, state_dict) if self._fallback else wall_ms()

    def write_alarm(self, alarm_id: str, alarm_dict: Dict[str, object]) -> int:
        if self._enabled:
            self._ref(f"/alarms/{alarm_id}").set(alarm_dict)
            return wall_ms()
        return self._fallback.write_alarm(alarm_id, alarm_dict) if self._fallback else wall_ms()

    def write_telemetry(self, device_id: str, telemetry_dict: Dict[str, object]) -> int:
        if self._enabled:
            self._ref(f"/telemetry/{device_id}").push(telemetry_dict)
            return wall_ms()
        return self._fallback.write_telemetry(device_id, telemetry_dict) if self._fallback else wall_ms()

    def healthcheck(self) -> bool:
        return self._enabled or (self._fallback is not None)

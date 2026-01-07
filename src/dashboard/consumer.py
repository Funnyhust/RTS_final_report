import json
import logging
from typing import Dict


class DashboardConsumer:
    def __init__(self, enabled: bool = True) -> None:
        self._enabled = enabled
        self._logger = logging.getLogger("dashboard")

    def emit(self, record: Dict[str, object]) -> None:
        if not self._enabled:
            return
        self._logger.info("DASHBOARD %s", json.dumps(record, separators=(",", ":")))

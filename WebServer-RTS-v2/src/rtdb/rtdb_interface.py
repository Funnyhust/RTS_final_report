from abc import ABC, abstractmethod
from typing import Dict


class RTDBInterface(ABC):
    @abstractmethod
    def write_state(self, device_id: str, state_dict: Dict[str, object]) -> int:
        raise NotImplementedError

    @abstractmethod
    def write_alarm(self, alarm_id: str, alarm_dict: Dict[str, object]) -> int:
        raise NotImplementedError

    @abstractmethod
    def write_telemetry(self, device_id: str, telemetry_dict: Dict[str, object]) -> int:
        raise NotImplementedError

    @abstractmethod
    def healthcheck(self) -> bool:
        raise NotImplementedError

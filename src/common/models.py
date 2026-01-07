from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class Message:
    msg_id: str
    device_id: str
    msg_type: str
    t_sensor_ms: Optional[int]
    seq: int
    values: Dict[str, Any]
    alarm: Optional[Dict[str, Any]] = None

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Message":
        return Message(
            msg_id=str(data.get("msg_id", "")),
            device_id=str(data.get("device_id", "")),
            msg_type=str(data.get("type", "")),
            t_sensor_ms=data.get("t_sensor_ms"),
            seq=int(data.get("seq", 0)),
            values=dict(data.get("values") or {}),
            alarm=data.get("alarm"),
        )


@dataclass
class TraceEvent:
    msg_id: str
    device_id: str
    msg_type: str
    t_sensor_ms: Optional[int]
    t_pc_rx_ms: int
    t_proc_start_ms: int
    t_proc_end_ms: int
    t_db_enqueue_ms: Optional[int]
    t_dashboard_emit_ms: Optional[int]
    deadline_ms: int
    avi_ms: int
    notes: str = ""

    def to_row(self) -> Dict[str, Any]:
        return {
            "msg_id": self.msg_id,
            "device_id": self.device_id,
            "msg_type": self.msg_type,
            "t_sensor_ms": self.t_sensor_ms if self.t_sensor_ms is not None else "",
            "t_pc_rx_ms": self.t_pc_rx_ms,
            "t_proc_start_ms": self.t_proc_start_ms,
            "t_proc_end_ms": self.t_proc_end_ms,
            "t_db_enqueue_ms": self.t_db_enqueue_ms if self.t_db_enqueue_ms is not None else "",
            "t_dashboard_emit_ms": self.t_dashboard_emit_ms if self.t_dashboard_emit_ms is not None else "",
            "deadline_ms": self.deadline_ms,
            "avi_ms": self.avi_ms,
            "notes": self.notes,
        }

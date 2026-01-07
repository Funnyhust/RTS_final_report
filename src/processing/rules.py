from typing import Dict, Tuple

from src.common.models import Message


DEFAULT_THRESHOLDS = {
    "temp": 60.0,
    "smoke": 0.7,
    "gas": 0.7,
    "flame": 1.0,
}


def classify(message: Message) -> Tuple[str, str]:
    if message.msg_type == "alarm":
        return "ALARM", "alarm_type"

    alarm = message.alarm or {}
    if alarm.get("fire_detected") is True or alarm.get("level") == "ALARM":
        return "ALARM", "alarm_payload"

    values = message.values or {}
    if values.get("flame", 0) >= DEFAULT_THRESHOLDS["flame"]:
        return "ALARM", "flame"
    if values.get("smoke", 0) >= DEFAULT_THRESHOLDS["smoke"]:
        return "WARN", "smoke"
    if values.get("gas", 0) >= DEFAULT_THRESHOLDS["gas"]:
        return "WARN", "gas"
    if values.get("temp", 0) >= DEFAULT_THRESHOLDS["temp"]:
        return "WARN", "temp"

    return "NORMAL", "ok"

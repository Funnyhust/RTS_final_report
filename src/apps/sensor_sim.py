import argparse
import json
import logging
import random
import time
import uuid
from typing import Dict, List

from src.common.config import get_cfg, load_config
from src.common.log import setup_logging
from src.common.time_utils import monotonic_ms, wall_ms
from src.comm.mqtt_client import MqttClient


def _build_values(alarm: bool) -> Dict[str, float]:
    if alarm:
        return {
            "temp": random.uniform(70, 90),
            "smoke": random.uniform(0.8, 1.0),
            "gas": random.uniform(0.8, 1.0),
            "flame": 1.0,
        }
    return {
        "temp": random.uniform(20, 40),
        "smoke": random.uniform(0.1, 0.6),
        "gas": random.uniform(0.05, 0.4),
        "flame": 0.0,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--duration-s", type=int, default=None)
    parser.add_argument("--feedback-path", default=None)
    parser.add_argument("--adaptive", action="store_true")
    args = parser.parse_args()

    cfg = load_config(args.config)
    setup_logging("sensor_sim")
    logger = logging.getLogger("sensor_sim")

    duration_s = args.duration_s or int(get_cfg(cfg, "benchmark.duration_s", 30))

    device_count = int(get_cfg(cfg, "sensor_sim.device_count", 1))
    prefix = str(get_cfg(cfg, "sensor_sim.device_id_prefix", "esp32-"))
    device_ids: List[str] = [f"{prefix}{i + 1:02d}" for i in range(device_count)]

    telemetry_rate = float(get_cfg(cfg, "sensor_sim.telemetry_rate", 50))
    alarm_rate = float(get_cfg(cfg, "sensor_sim.alarm_rate", 0.2))
    burst_rate = float(get_cfg(cfg, "sensor_sim.burst_rate", telemetry_rate))
    burst_duration_s = float(get_cfg(cfg, "sensor_sim.burst_duration_s", 0))
    burst_start_s = float(get_cfg(cfg, "sensor_sim.burst_start_s", 0))

    mqtt_client = MqttClient(
        host=get_cfg(cfg, "mqtt.host"),
        port=int(get_cfg(cfg, "mqtt.port")),
        keepalive_s=int(get_cfg(cfg, "mqtt.keepalive_s")),
    )
    mqtt_client.connect()

    telemetry_topic = get_cfg(cfg, "mqtt.telemetry_topic")
    alert_topic = get_cfg(cfg, "mqtt.alert_topic")

    seq_by_device: Dict[str, int] = {d: 0 for d in device_ids}

    adaptive_enabled = args.adaptive or bool(get_cfg(cfg, "sensor_sim.adaptive", False))
    feedback_path = args.feedback_path
    feedback_check_ms = 1000
    rate_scale = 1.0

    start_ms = monotonic_ms()
    next_telemetry_ms = start_ms
    next_alarm_ms = start_ms
    alarm_period_ms = max(1, int(1000 / alarm_rate)) if alarm_rate > 0 else None
    next_feedback_ms = start_ms + feedback_check_ms

    telemetry_index = 0

    logger.info("Sensor simulator running for %s seconds", duration_s)

    try:
        while (monotonic_ms() - start_ms) < duration_s * 1000:
            now_ms = monotonic_ms()
            elapsed_s = (now_ms - start_ms) / 1000.0

            if adaptive_enabled and feedback_path and now_ms >= next_feedback_ms:
                try:
                    with open(feedback_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    rate_scale = float(data.get("telemetry_rate_scale", 1.0))
                except Exception:
                    pass
                next_feedback_ms = now_ms + feedback_check_ms

            current_rate = telemetry_rate
            if burst_duration_s > 0 and burst_start_s <= elapsed_s < (burst_start_s + burst_duration_s):
                current_rate = burst_rate
            current_rate = max(0.1, current_rate * rate_scale)

            telemetry_period_ms = max(1, int(1000 / current_rate)) if current_rate > 0 else 1000

            if now_ms >= next_telemetry_ms:
                device_id = device_ids[telemetry_index % len(device_ids)]
                seq_by_device[device_id] += 1
                payload = {
                    "msg_id": str(uuid.uuid4()),
                    "device_id": device_id,
                    "type": "telemetry",
                    "t_sensor_ms": wall_ms(),
                    "seq": seq_by_device[device_id],
                    "values": _build_values(alarm=False),
                }
                mqtt_client.publish(telemetry_topic, payload, qos=0)
                telemetry_index += 1
                next_telemetry_ms = now_ms + telemetry_period_ms

            if alarm_period_ms is not None and now_ms >= next_alarm_ms:
                device_id = random.choice(device_ids)
                seq_by_device[device_id] += 1
                payload = {
                    "msg_id": str(uuid.uuid4()),
                    "device_id": device_id,
                    "type": "alarm",
                    "t_sensor_ms": wall_ms(),
                    "seq": seq_by_device[device_id],
                    "values": _build_values(alarm=True),
                    "alarm": {"fire_detected": True, "level": "ALARM"},
                }
                mqtt_client.publish(alert_topic, payload, qos=1)
                next_alarm_ms = now_ms + alarm_period_ms

            time.sleep(0.001)
    finally:
        mqtt_client.disconnect()
        logger.info("Sensor simulator stopped")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

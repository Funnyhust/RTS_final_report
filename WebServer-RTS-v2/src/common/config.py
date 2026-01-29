import os
from typing import Any, Dict

import yaml


class ConfigError(RuntimeError):
    pass


def _deep_setdefault(cfg: Dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    cur = cfg
    for p in parts[:-1]:
        if p not in cur or not isinstance(cur[p], dict):
            cur[p] = {}
        cur = cur[p]
    cur.setdefault(parts[-1], value)


def _apply_defaults(cfg: Dict[str, Any]) -> Dict[str, Any]:
    defaults = {
        "mqtt.host": "localhost",
        "mqtt.port": 1883,
        "mqtt.keepalive_s": 60,
        "mqtt.alert_topic": "fire_system/alert",
        "mqtt.telemetry_topic": "fire_system/sensor/data",
        "mqtt.status_topic": "fire_system/status",
        "deadlines.alarm_deadline_ms": 150,
        "deadlines.telemetry_deadline_ms": 300,
        "pipeline.inject_jitter_telemetry_ms": 0,
        "pipeline.telemetry_queue_max": 10000,
        "pipeline.telemetry_drop_policy": "none",
        "pipeline.alarm_queue_max": 1000,
        "rtdb.mode": "mock",
        "rtdb.write_mode": "sync",
        "rtdb.mock.ack_delay_ms": 20,
        "rtdb.writer.flush_interval_ms": 200,
        "rtdb.writer.batch_limit": 100,
        "rtdb.writer.telemetry_drop_policy": "keep_latest",
        "rtdb.writer.telemetry_queue_max": 2000,
        "rtdb.writer.alarm_queue_max": 1000,
        "rtdb.writer.state_queue_max": 1000,
        "freshness.avi_state_ms": 2000,
        "freshness.avi_telemetry_ms": 5000,
        "freshness.avi_alarm_ms": 10000,
        "sensor_sim.telemetry_rate": 50,
        "sensor_sim.alarm_rate": 0.2,
        "sensor_sim.device_count": 3,
        "sensor_sim.device_id_prefix": "esp32-",
        "sensor_sim.burst_rate": 200,
        "sensor_sim.burst_duration_s": 5,
        "sensor_sim.burst_start_s": 10,
        "sensor_sim.adaptive": False,
        "feedback.enabled": True,
        "feedback.interval_s": 5,
        "feedback.min_freshness_ratio": 0.8,
        "feedback.rate_scale": 0.5,
        "benchmark.duration_s": 30,
        "benchmark.warmup_s": 3,
    }
    for k, v in defaults.items():
        _deep_setdefault(cfg, k, v)
    return cfg


def _validate(cfg: Dict[str, Any]) -> None:
    required_paths = [
        "mqtt.host",
        "mqtt.port",
        "deadlines.alarm_deadline_ms",
        "deadlines.telemetry_deadline_ms",
        "rtdb.mode",
        "rtdb.write_mode",
    ]
    for path in required_paths:
        if get_cfg(cfg, path, default=None) is None:
            raise ConfigError(f"Missing required config: {path}")

    rtdb_mode = get_cfg(cfg, "rtdb.mode", "mock")
    if rtdb_mode not in ("mock", "firebase"):
        raise ConfigError("rtdb.mode must be 'mock' or 'firebase'")

    write_mode = get_cfg(cfg, "rtdb.write_mode", "sync")
    if write_mode not in ("sync", "async"):
        raise ConfigError("rtdb.write_mode must be 'sync' or 'async'")


def load_config(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        raise ConfigError(f"Config file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ConfigError("Config must be a mapping")
    data = _apply_defaults(data)
    _validate(data)
    return data


def get_cfg(cfg: Dict[str, Any], path: str, default: Any = None) -> Any:
    cur: Any = cfg
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur

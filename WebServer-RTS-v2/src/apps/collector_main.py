import argparse
import json
import logging
import os
import signal
import threading
import time
from typing import Dict, Optional

from src.common.config import get_cfg, load_config
from src.common.log import setup_logging
from src.common.models import Message, TraceEvent
from src.common.time_utils import wall_ms
from src.common.trace import AckWriter, TraceWriter
from src.comm.mqtt_client import MqttClient
from src.dashboard.consumer import DashboardConsumer
from src.processing.pipeline import Pipeline
from src.rtdb.db_writer import DbWriter
from src.rtdb.firebase_backend import FirebaseBackend
from src.rtdb.mock_backend import MockBackend


class Stats:
    def __init__(self) -> None:
        self.received = {"alarm": 0, "telemetry": 0, "status": 0}
        self.dropped_pipeline = 0
        self.dropped_db = 0
        self.queue_max_pipeline = 0
        self.queue_max_db = 0

    def to_dict(self) -> Dict[str, object]:
        return {
            "received": self.received,
            "dropped_pipeline": self.dropped_pipeline,
            "dropped_db": self.dropped_db,
            "queue_max_pipeline": self.queue_max_pipeline,
            "queue_max_db": self.queue_max_db,
        }


def build_state(msg: Message, severity: str, avi_ms: int, src: str) -> Dict[str, object]:
    return {
        "ts_ms": msg.t_sensor_ms or wall_ms(),
        "severity": severity,
        "values": msg.values,
        "avi_ms": avi_ms,
        "src": src,
    }


def build_alarm(msg: Message, severity: str) -> Dict[str, object]:
    return {
        "deviceId": msg.device_id,
        "ts_ms": msg.t_sensor_ms or wall_ms(),
        "severity": severity,
        "values": msg.values,
        "ack": False,
        "note": "",
    }


def build_telemetry(msg: Message) -> Dict[str, object]:
    return {
        "ts_ms": msg.t_sensor_ms or wall_ms(),
        "values": msg.values,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--results-dir", default=None)
    parser.add_argument("--duration-s", type=int, default=None)
    args = parser.parse_args()

    cfg = load_config(args.config)
    results_dir = args.results_dir or os.path.join("results", "run")
    os.makedirs(results_dir, exist_ok=True)

    setup_logging("collector")
    logger = logging.getLogger("collector")

    trace_writer = TraceWriter(os.path.join(results_dir, "trace_events.csv"))
    ack_writer = AckWriter(os.path.join(results_dir, "trace_db_ack.csv"))

    rtdb_mode = get_cfg(cfg, "rtdb.mode", "mock")
    mock_path = os.path.join(results_dir, "mock_rtdb.jsonl")
    mock_backend = MockBackend(mock_path, int(get_cfg(cfg, "rtdb.mock.ack_delay_ms", 0)))

    if rtdb_mode == "firebase":
        backend = FirebaseBackend(
            get_cfg(cfg, "rtdb.firebase.service_account_json", ""),
            get_cfg(cfg, "rtdb.firebase.database_url", ""),
            fallback=mock_backend,
        )
    else:
        backend = mock_backend

    write_mode = get_cfg(cfg, "rtdb.write_mode", "sync")
    db_writer: Optional[DbWriter] = None
    if write_mode == "async":
        db_writer = DbWriter(backend, ack_writer, cfg)
        db_writer.start()

    stats = Stats()

    dashboard = DashboardConsumer(enabled=True)
    feedback_enabled = bool(get_cfg(cfg, "feedback.enabled", True))
    feedback_interval_s = int(get_cfg(cfg, "feedback.interval_s", 5))
    feedback_min_ratio = float(get_cfg(cfg, "feedback.min_freshness_ratio", 0.8))
    feedback_rate_scale = float(get_cfg(cfg, "feedback.rate_scale", 0.5))
    feedback_path = os.path.join(results_dir, "feedback.json")
    feedback_lock = threading.Lock()
    feedback_last_ts = time.monotonic()
    telemetry_fresh = 0
    telemetry_total = 0

    def on_processed(item: Dict[str, object]) -> None:
        nonlocal telemetry_fresh, telemetry_total, feedback_last_ts
        msg: Message = item["message"]
        msg_type = msg.msg_type
        t_pc_rx_ms = int(item["t_pc_rx_ms"])
        t_proc_start_ms = int(item["t_proc_start_ms"])
        t_proc_end_ms = int(item["t_proc_end_ms"])
        severity = str(item["severity"])
        rule_note = str(item["rule_note"])

        deadline_ms = int(
            get_cfg(cfg, "deadlines.alarm_deadline_ms" if msg_type == "alarm" else "deadlines.telemetry_deadline_ms")
        )

        avi_ms = int(
            get_cfg(
                cfg,
                "freshness.avi_alarm_ms" if msg_type == "alarm" else "freshness.avi_telemetry_ms",
            )
        )

        t_db_enqueue_ms = wall_ms()
        src = "sim"
        state = build_state(msg, severity, int(get_cfg(cfg, "freshness.avi_state_ms")), src)
        alarm = build_alarm(msg, severity)
        telemetry = build_telemetry(msg)

        notes = rule_note

        if write_mode == "sync":
            ack_ms = backend.write_state(msg.device_id, state)
            if msg_type == "alarm":
                ack_ms = backend.write_alarm(msg.msg_id, alarm)
            elif msg_type == "telemetry":
                ack_ms = backend.write_telemetry(msg.device_id, telemetry)
            ack_writer.write_ack(msg.msg_id, ack_ms)

            t_dashboard_emit_ms = wall_ms()
            dashboard.emit({"msg_id": msg.msg_id, "type": msg_type, "severity": severity})
        else:
            record = {
                "msg_id": msg.msg_id,
                "device_id": msg.device_id,
                "msg_type": msg_type,
                "state": state,
                "alarm": alarm,
                "telemetry": telemetry,
                "t_db_enqueue_ms": t_db_enqueue_ms,
            }
            ok = db_writer.enqueue(record) if db_writer else False
            if not ok:
                notes = (notes + ";db_drop").strip(";")

            t_dashboard_emit_ms = wall_ms()
            dashboard.emit({"msg_id": msg.msg_id, "type": msg_type, "severity": severity})

        trace = TraceEvent(
            msg_id=msg.msg_id,
            device_id=msg.device_id,
            msg_type=msg_type,
            t_sensor_ms=msg.t_sensor_ms,
            t_pc_rx_ms=t_pc_rx_ms,
            t_proc_start_ms=t_proc_start_ms,
            t_proc_end_ms=t_proc_end_ms,
            t_db_enqueue_ms=t_db_enqueue_ms,
            t_dashboard_emit_ms=t_dashboard_emit_ms,
            deadline_ms=deadline_ms,
            avi_ms=avi_ms,
            notes=notes,
        )
        trace_writer.write_event(trace.to_row())

        if feedback_enabled and msg_type == "telemetry":
            ts_base = msg.t_sensor_ms or t_pc_rx_ms
            if t_dashboard_emit_ms - ts_base <= avi_ms:
                telemetry_fresh += 1
            telemetry_total += 1

            if (time.monotonic() - feedback_last_ts) >= feedback_interval_s:
                ratio = telemetry_fresh / telemetry_total if telemetry_total > 0 else 1.0
                scale = feedback_rate_scale if ratio < feedback_min_ratio else 1.0
                payload = {
                    "freshness_ratio_telemetry": round(ratio, 3),
                    "telemetry_rate_scale": scale,
                }
                with feedback_lock:
                    with open(feedback_path, "w", encoding="utf-8") as f:
                        json.dump(payload, f, indent=2)
                telemetry_fresh = 0
                telemetry_total = 0
                feedback_last_ts = time.monotonic()

    pipeline = Pipeline(cfg, on_processed)
    pipeline.start()

    mqtt_client = MqttClient(
        host=get_cfg(cfg, "mqtt.host"),
        port=int(get_cfg(cfg, "mqtt.port")),
        keepalive_s=int(get_cfg(cfg, "mqtt.keepalive_s")),
    )

    def on_message(topic: str, payload: bytes) -> None:
        t_pc_rx = wall_ms()
        try:
            data = json.loads(payload.decode("utf-8"))
        except Exception:
            logger.warning("Invalid JSON payload on %s", topic)
            return

        msg_type = data.get("type")
        if not msg_type:
            if topic.endswith("alert"):
                msg_type = "alarm"
            elif topic.endswith("status"):
                msg_type = "status"
            else:
                msg_type = "telemetry"
            data["type"] = msg_type

        msg = Message.from_dict(data)
        stats.received[msg.msg_type] = stats.received.get(msg.msg_type, 0) + 1

        item = {"message": msg, "t_pc_rx_ms": t_pc_rx}
        pipeline.enqueue(item)

        stats.queue_max_pipeline = max(stats.queue_max_pipeline, pipeline.queue_max_observed)
        if db_writer:
            stats.queue_max_db = max(stats.queue_max_db, db_writer.queue_max_observed)

    mqtt_client.set_message_handler(on_message)
    mqtt_client.connect()

    mqtt_client.subscribe(get_cfg(cfg, "mqtt.alert_topic"), qos=1)
    mqtt_client.subscribe(get_cfg(cfg, "mqtt.telemetry_topic"), qos=0)
    mqtt_client.subscribe(get_cfg(cfg, "mqtt.status_topic"), qos=0)

    stop_event = threading.Event()

    def _handle_stop(signum: int, frame: object) -> None:
        stop_event.set()

    signal.signal(signal.SIGINT, _handle_stop)
    signal.signal(signal.SIGTERM, _handle_stop)

    logger.info("Collector running. Press Ctrl+C to stop.")
    start_time = time.monotonic()
    try:
        while not stop_event.is_set():
            if args.duration_s is not None and (time.monotonic() - start_time) >= args.duration_s:
                stop_event.set()
                break
            time.sleep(0.5)
    finally:
        logger.info("Shutting down collector")
        mqtt_client.disconnect()
        pipeline.stop()
        if db_writer:
            db_writer.stop()
        stats.dropped_pipeline = pipeline.drop_count_telemetry
        stats.queue_max_pipeline = max(stats.queue_max_pipeline, pipeline.queue_max_observed)
        if db_writer:
            stats.dropped_db = db_writer.drop_count_telemetry
            stats.queue_max_db = max(stats.queue_max_db, db_writer.queue_max_observed)
        stats_path = os.path.join(results_dir, "run_stats.json")
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(stats.to_dict(), f, indent=2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

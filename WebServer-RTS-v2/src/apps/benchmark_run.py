import argparse
import csv
import json
import os
import subprocess
import sys
import time
from typing import Dict, List, Optional

from src.common.config import get_cfg, load_config
from src.common.metrics import jitter, miss_rate, percentile, freshness_ratio


TRACE_FINAL_FIELDS = [
    "msg_id",
    "device_id",
    "msg_type",
    "t_sensor_ms",
    "t_pc_rx_ms",
    "t_proc_start_ms",
    "t_proc_end_ms",
    "t_db_enqueue_ms",
    "t_db_ack_ms",
    "t_dashboard_emit_ms",
    "deadline_ms",
    "end_to_end_ms",
    "db_time_ms",
    "non_db_time_ms",
    "deadline_miss",
    "avi_ms",
    "is_fresh",
    "notes",
]


def _safe_int(value: str) -> Optional[int]:
    if value is None:
        return None
    value = str(value).strip()
    if value == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def join_trace(events_path: str, ack_path: str, final_path: str) -> List[Dict[str, object]]:
    ack_map: Dict[str, Optional[int]] = {}
    if os.path.exists(ack_path):
        with open(ack_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                msg_id = row.get("msg_id", "")
                ack_ms = _safe_int(row.get("t_db_ack_ms", ""))
                if ack_ms is not None and ack_ms < 0:
                    ack_ms = None
                ack_map[msg_id] = ack_ms

    rows: List[Dict[str, object]] = []
    with open(events_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            msg_id = row.get("msg_id", "")
            t_sensor_ms = _safe_int(row.get("t_sensor_ms", ""))
            t_pc_rx_ms = _safe_int(row.get("t_pc_rx_ms", ""))
            t_proc_start_ms = _safe_int(row.get("t_proc_start_ms", ""))
            t_proc_end_ms = _safe_int(row.get("t_proc_end_ms", ""))
            t_db_enqueue_ms = _safe_int(row.get("t_db_enqueue_ms", ""))
            t_dashboard_emit_ms = _safe_int(row.get("t_dashboard_emit_ms", ""))
            deadline_ms = _safe_int(row.get("deadline_ms", ""))
            avi_ms = _safe_int(row.get("avi_ms", ""))
            notes = row.get("notes", "") or ""

            t_db_ack_ms = ack_map.get(msg_id)
            if t_db_ack_ms is None:
                if notes:
                    notes = notes + ";db_ack_missing"
                else:
                    notes = "db_ack_missing"

            ts_base = t_sensor_ms if t_sensor_ms is not None else t_pc_rx_ms
            end_to_end_ms = None
            if t_dashboard_emit_ms is not None and ts_base is not None:
                end_to_end_ms = t_dashboard_emit_ms - ts_base

            db_time_ms = None
            if t_db_ack_ms is not None and t_db_enqueue_ms is not None:
                db_time_ms = t_db_ack_ms - t_db_enqueue_ms

            non_db_time_ms = None
            if t_dashboard_emit_ms is not None and t_pc_rx_ms is not None and db_time_ms is not None:
                non_db_time_ms = t_dashboard_emit_ms - t_pc_rx_ms - db_time_ms

            deadline_miss = None
            if end_to_end_ms is not None and deadline_ms is not None:
                deadline_miss = 1 if end_to_end_ms > deadline_ms else 0

            is_fresh = None
            if t_dashboard_emit_ms is not None and ts_base is not None and avi_ms is not None:
                is_fresh = 1 if (t_dashboard_emit_ms - ts_base) <= avi_ms else 0

            out_row = {
                "msg_id": msg_id,
                "device_id": row.get("device_id", ""),
                "msg_type": row.get("msg_type", ""),
                "t_sensor_ms": t_sensor_ms if t_sensor_ms is not None else "",
                "t_pc_rx_ms": t_pc_rx_ms if t_pc_rx_ms is not None else "",
                "t_proc_start_ms": t_proc_start_ms if t_proc_start_ms is not None else "",
                "t_proc_end_ms": t_proc_end_ms if t_proc_end_ms is not None else "",
                "t_db_enqueue_ms": t_db_enqueue_ms if t_db_enqueue_ms is not None else "",
                "t_db_ack_ms": t_db_ack_ms if t_db_ack_ms is not None else "",
                "t_dashboard_emit_ms": t_dashboard_emit_ms if t_dashboard_emit_ms is not None else "",
                "deadline_ms": deadline_ms if deadline_ms is not None else "",
                "end_to_end_ms": end_to_end_ms if end_to_end_ms is not None else "",
                "db_time_ms": db_time_ms if db_time_ms is not None else "",
                "non_db_time_ms": non_db_time_ms if non_db_time_ms is not None else "",
                "deadline_miss": deadline_miss if deadline_miss is not None else "",
                "avi_ms": avi_ms if avi_ms is not None else "",
                "is_fresh": is_fresh if is_fresh is not None else "",
                "notes": notes,
            }
            rows.append(out_row)

    with open(final_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=TRACE_FINAL_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    return rows


def compute_summary(rows: List[Dict[str, object]], cfg: Dict[str, object], duration_s: int, stats_path: str) -> Dict[str, object]:
    alarm_e2e: List[Optional[int]] = []
    telemetry_e2e: List[Optional[int]] = []
    db_times: List[Optional[int]] = []
    fresh_telemetry: List[int] = []
    fresh_state: List[int] = []

    avi_state_ms = int(get_cfg(cfg, "freshness.avi_state_ms", 2000))

    for row in rows:
        msg_type = row.get("msg_type")
        end_to_end = _safe_int(str(row.get("end_to_end_ms", "")))
        db_time = _safe_int(str(row.get("db_time_ms", "")))
        is_fresh = row.get("is_fresh", "")

        if msg_type == "alarm":
            alarm_e2e.append(end_to_end)
        else:
            telemetry_e2e.append(end_to_end)

        if db_time is not None:
            db_times.append(db_time)

        if msg_type == "telemetry" and is_fresh != "":
            fresh_telemetry.append(int(is_fresh))

        # State freshness is computed for every message using avi_state_ms
        t_dashboard_emit_ms = _safe_int(str(row.get("t_dashboard_emit_ms", "")))
        ts_base = _safe_int(str(row.get("t_sensor_ms", "")))
        if ts_base is None:
            ts_base = _safe_int(str(row.get("t_pc_rx_ms", "")))
        if t_dashboard_emit_ms is not None and ts_base is not None:
            fresh_state.append(1 if (t_dashboard_emit_ms - ts_base) <= avi_state_ms else 0)

    alarm_deadline = int(get_cfg(cfg, "deadlines.alarm_deadline_ms"))
    telemetry_deadline = int(get_cfg(cfg, "deadlines.telemetry_deadline_ms"))

    summary = {
        "duration_s": duration_s,
        "throughput_msg_s": round(len(rows) / duration_s, 2) if duration_s > 0 else 0,
        "alarm_p50_ms": percentile(alarm_e2e, 50),
        "alarm_p95_ms": percentile(alarm_e2e, 95),
        "alarm_p99_ms": percentile(alarm_e2e, 99),
        "alarm_jitter_ms": jitter(alarm_e2e),
        "alarm_deadline_miss_rate": miss_rate(alarm_e2e, alarm_deadline),
        "telemetry_p50_ms": percentile(telemetry_e2e, 50),
        "telemetry_p95_ms": percentile(telemetry_e2e, 95),
        "telemetry_p99_ms": percentile(telemetry_e2e, 99),
        "telemetry_jitter_ms": jitter(telemetry_e2e),
        "telemetry_deadline_miss_rate": miss_rate(telemetry_e2e, telemetry_deadline),
        "db_time_p95_ms": percentile(db_times, 95),
        "db_time_p99_ms": percentile(db_times, 99),
        "freshness_ratio_telemetry": freshness_ratio(fresh_telemetry),
        "freshness_ratio_state": freshness_ratio(fresh_state),
    }

    if os.path.exists(stats_path):
        with open(stats_path, "r", encoding="utf-8") as f:
            stats = json.load(f)
        summary["dropped_pipeline"] = stats.get("dropped_pipeline")
        summary["dropped_db"] = stats.get("dropped_db")
        summary["queue_max_pipeline"] = stats.get("queue_max_pipeline")
        summary["queue_max_db"] = stats.get("queue_max_db")

    return summary


def write_summary(summary: Dict[str, object], results_dir: str) -> None:
    json_path = os.path.join(results_dir, "summary.json")
    csv_path = os.path.join(results_dir, "summary.csv")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(summary.keys()))
        writer.writeheader()
        writer.writerow(summary)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--results-dir", required=True)
    parser.add_argument("--duration-s", type=int, default=None)
    args = parser.parse_args()

    cfg = load_config(args.config)
    os.makedirs(args.results_dir, exist_ok=True)

    duration_s = args.duration_s or int(get_cfg(cfg, "benchmark.duration_s", 30))

    collector_cmd = [
        sys.executable,
        "-m",
        "src.apps.collector_main",
        "--config",
        args.config,
        "--results-dir",
        args.results_dir,
        "--duration-s",
        str(duration_s + 2),
    ]
    sensor_cmd = [
        sys.executable,
        "-m",
        "src.apps.sensor_sim",
        "--config",
        args.config,
        "--duration-s",
        str(duration_s),
        "--feedback-path",
        os.path.join(args.results_dir, "feedback.json"),
    ]

    collector_proc = subprocess.Popen(collector_cmd)
    time.sleep(1.0)
    sensor_proc = subprocess.Popen(sensor_cmd)

    sensor_proc.wait()
    try:
        collector_proc.wait(timeout=duration_s + 5)
    except subprocess.TimeoutExpired:
        collector_proc.terminate()
        collector_proc.wait(timeout=5)

    events_path = os.path.join(args.results_dir, "trace_events.csv")
    ack_path = os.path.join(args.results_dir, "trace_db_ack.csv")
    final_path = os.path.join(args.results_dir, "trace_final.csv")

    rows = join_trace(events_path, ack_path, final_path)

    summary = compute_summary(rows, cfg, duration_s, os.path.join(args.results_dir, "run_stats.json"))
    write_summary(summary, args.results_dir)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

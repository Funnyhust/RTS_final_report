import logging
import queue
import random
import threading
import time
from typing import Callable, Dict, Optional

from src.common.time_utils import wall_ms
from src.processing import rules


class Pipeline:
    def __init__(self, cfg: Dict[str, object], on_processed: Callable[[Dict[str, object]], None]) -> None:
        self._logger = logging.getLogger("pipeline")
        self._on_processed = on_processed
        self._inject_jitter_ms = int(cfg["pipeline"]["inject_jitter_telemetry_ms"])
        self._telemetry_drop_policy = str(cfg["pipeline"]["telemetry_drop_policy"])
        self._alarm_queue = queue.Queue(maxsize=int(cfg["pipeline"]["alarm_queue_max"]))
        self._telemetry_queue = queue.Queue(maxsize=int(cfg["pipeline"]["telemetry_queue_max"]))
        self._stop_event = threading.Event()
        self._worker = threading.Thread(target=self._run, daemon=True)

        self.drop_count_telemetry = 0
        self.queue_max_observed = 0

    def start(self) -> None:
        self._worker.start()

    def stop(self) -> None:
        self._stop_event.set()
        self._worker.join(timeout=2)

    def enqueue(self, payload: Dict[str, object]) -> bool:
        msg_type = str(payload.get("msg_type") or getattr(payload.get("message"), "msg_type", ""))
        if msg_type == "alarm":
            self._alarm_queue.put(payload)
            return True

        # telemetry or status
        if self._telemetry_queue.full():
            if self._telemetry_drop_policy == "none":
                self._telemetry_queue.put(payload)
                return True
            if self._telemetry_drop_policy == "keep_latest":
                try:
                    _ = self._telemetry_queue.get_nowait()
                except queue.Empty:
                    pass
                self._telemetry_queue.put(payload)
                self.drop_count_telemetry += 1
                return True
            # drop policy: drop
            self.drop_count_telemetry += 1
            return False

        self._telemetry_queue.put(payload)
        qsize = self._telemetry_queue.qsize()
        if qsize > self.queue_max_observed:
            self.queue_max_observed = qsize
        return True

    def _run(self) -> None:
        while not self._stop_event.is_set():
            item = None
            try:
                item = self._alarm_queue.get_nowait()
            except queue.Empty:
                pass

            if item is None:
                try:
                    item = self._telemetry_queue.get(timeout=0.05)
                except queue.Empty:
                    continue

            if item is None:
                continue

            msg = item["message"]
            msg_type = msg.msg_type

            t_proc_start_ms = wall_ms()
            if msg_type != "alarm" and self._inject_jitter_ms > 0:
                time.sleep(random.randint(0, self._inject_jitter_ms) / 1000.0)

            severity, rule_note = rules.classify(msg)
            t_proc_end_ms = wall_ms()

            item["severity"] = severity
            item["rule_note"] = rule_note
            item["t_proc_start_ms"] = t_proc_start_ms
            item["t_proc_end_ms"] = t_proc_end_ms
            self._on_processed(item)

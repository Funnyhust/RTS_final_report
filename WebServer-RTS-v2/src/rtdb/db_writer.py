import logging
import queue
import threading
import time
from collections import deque
from typing import Deque, Dict, Optional

from src.common.time_utils import monotonic_ms
from src.rtdb.rtdb_interface import RTDBInterface
from src.common.trace import AckWriter


class DbWriter:
    def __init__(self, backend: RTDBInterface, ack_writer: AckWriter, cfg: Dict[str, object]) -> None:
        self._logger = logging.getLogger("db_writer")
        self._backend = backend
        self._ack_writer = ack_writer

        writer_cfg = cfg["rtdb"]["writer"]
        self._flush_interval_ms = int(writer_cfg["flush_interval_ms"])
        self._batch_limit = int(writer_cfg["batch_limit"])
        self._telemetry_drop_policy = str(writer_cfg["telemetry_drop_policy"])
        self._telemetry_queue_max = int(writer_cfg["telemetry_queue_max"])
        self._alarm_queue_max = int(writer_cfg["alarm_queue_max"])
        self._state_queue_max = int(writer_cfg["state_queue_max"])

        self._alarm_queue: queue.Queue = queue.Queue(maxsize=self._alarm_queue_max)
        self._state_queue: queue.Queue = queue.Queue(maxsize=self._state_queue_max)
        self._telemetry_latest: Dict[str, Dict[str, object]] = {}
        self._telemetry_order: Deque[str] = deque()

        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

        self.drop_count_telemetry = 0
        self.queue_max_observed = 0

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        self._thread.join(timeout=2)
        self._flush_all()

    def enqueue(self, record: Dict[str, object]) -> bool:
        msg_type = str(record.get("msg_type"))
        device_id = str(record.get("device_id"))

        if msg_type == "alarm":
            self._alarm_queue.put(record)
            return True

        if msg_type == "status":
            self._state_queue.put(record)
            return True

        # telemetry path
        if device_id in self._telemetry_latest:
            self._telemetry_latest[device_id] = record
        else:
            if len(self._telemetry_latest) >= self._telemetry_queue_max:
                if self._telemetry_drop_policy == "keep_latest":
                    if self._telemetry_order:
                        oldest = self._telemetry_order.popleft()
                        self._telemetry_latest.pop(oldest, None)
                        self.drop_count_telemetry += 1
                    else:
                        self.drop_count_telemetry += 1
                        return False
                else:
                    self.drop_count_telemetry += 1
                    return False
            self._telemetry_latest[device_id] = record
            self._telemetry_order.append(device_id)

        qsize = len(self._telemetry_latest)
        if qsize > self.queue_max_observed:
            self.queue_max_observed = qsize
        return True

    def _run(self) -> None:
        next_flush = monotonic_ms() + self._flush_interval_ms
        while not self._stop_event.is_set():
            item = None
            try:
                item = self._alarm_queue.get_nowait()
            except queue.Empty:
                pass

            if item is None:
                try:
                    item = self._state_queue.get_nowait()
                except queue.Empty:
                    pass

            if item is not None:
                self._write_record(item)
                continue

            now = monotonic_ms()
            if self._telemetry_latest and (now >= next_flush or len(self._telemetry_latest) >= self._batch_limit):
                self._flush_batch(self._batch_limit)
                next_flush = monotonic_ms() + self._flush_interval_ms
                continue

            time.sleep(0.01)

    def _flush_batch(self, limit: int) -> None:
        count = 0
        while self._telemetry_order and count < limit:
            device_id = self._telemetry_order.popleft()
            record = self._telemetry_latest.pop(device_id, None)
            if record is None:
                continue
            self._write_record(record)
            count += 1

    def _flush_all(self) -> None:
        self._flush_batch(len(self._telemetry_order))
        while not self._alarm_queue.empty():
            try:
                item = self._alarm_queue.get_nowait()
                self._write_record(item)
            except queue.Empty:
                break
        while not self._state_queue.empty():
            try:
                item = self._state_queue.get_nowait()
                self._write_record(item)
            except queue.Empty:
                break

    def _write_record(self, record: Dict[str, object]) -> None:
        msg_id = str(record.get("msg_id"))
        device_id = str(record.get("device_id"))
        msg_type = str(record.get("msg_type"))

        state = record.get("state") or {}
        alarm = record.get("alarm") or {}
        telemetry = record.get("telemetry") or {}

        ack_ms = self._backend.write_state(device_id, state)
        if msg_type == "alarm":
            ack_ms = self._backend.write_alarm(msg_id, alarm)
        elif msg_type == "telemetry":
            ack_ms = self._backend.write_telemetry(device_id, telemetry)

        self._ack_writer.write_ack(msg_id, ack_ms)

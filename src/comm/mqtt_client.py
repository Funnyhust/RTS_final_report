import json
import logging
import threading
from typing import Any, Callable, Optional

import paho.mqtt.client as mqtt


class MqttClient:
    def __init__(self, host: str, port: int, keepalive_s: int = 60) -> None:
        self.host = host
        self.port = port
        self.keepalive_s = keepalive_s
        self.client = mqtt.Client()
        self._on_message_cb: Optional[Callable[[str, bytes], None]] = None
        self._lock = threading.Lock()
        self._logger = logging.getLogger("mqtt")

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

    def set_message_handler(self, handler: Callable[[str, bytes], None]) -> None:
        self._on_message_cb = handler

    def connect(self) -> None:
        self.client.connect(self.host, self.port, self.keepalive_s)
        self.client.loop_start()

    def disconnect(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()

    def subscribe(self, topic: str, qos: int = 0) -> None:
        self.client.subscribe(topic, qos=qos)

    def publish(self, topic: str, payload: Any, qos: int = 0) -> None:
        if not isinstance(payload, str):
            payload = json.dumps(payload)
        self.client.publish(topic, payload=payload, qos=qos)

    def _on_connect(self, client: mqtt.Client, userdata: Any, flags: dict, rc: int) -> None:
        if rc == 0:
            self._logger.info("MQTT connected")
        else:
            self._logger.warning("MQTT connect failed rc=%s", rc)

    def _on_disconnect(self, client: mqtt.Client, userdata: Any, rc: int) -> None:
        self._logger.warning("MQTT disconnected rc=%s", rc)

    def _on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        if self._on_message_cb:
            self._on_message_cb(msg.topic, msg.payload)

"""
Command Forwarder: Firebase RTDB → MQTT

Listens to Firebase RTDB for commands written by Web Dashboard,
then forwards them to the ESP32 via MQTT.
"""
import argparse
import json
import logging
import time
from threading import Thread
from typing import Dict, Any, Optional

try:
    import firebase_admin
    from firebase_admin import credentials, db
except ImportError:
    firebase_admin = None
    credentials = None
    db = None

import paho.mqtt.client as mqtt


logger = logging.getLogger("cmd_forwarder")


# MQTT Control Topic (device listens on this)
MQTT_CONTROL_TOPIC = "fire_system/control"


class CommandForwarder:
    """
    Watches Firebase RTDB /commands/* for new entries and publishes them to MQTT.
    """

    def __init__(
        self,
        firebase_cred_path: str,
        firebase_db_url: str,
        mqtt_host: str,
        mqtt_port: int = 1883,
    ) -> None:
        self.firebase_cred_path = firebase_cred_path
        self.firebase_db_url = firebase_db_url
        self.mqtt_host = mqtt_host
        self.mqtt_port = mqtt_port

        self._mqtt_client: Optional[mqtt.Client] = None
        self._running = False
        self._listener_thread: Optional[Thread] = None

    def _init_firebase(self) -> bool:
        """Initialize Firebase Admin SDK."""
        if firebase_admin is None:
            logger.error("firebase-admin not installed. pip install firebase-admin")
            return False

        try:
            cred = credentials.Certificate(self.firebase_cred_path)
            firebase_admin.initialize_app(cred, {
                "databaseURL": self.firebase_db_url,
            })
            logger.info("Firebase initialized: %s", self.firebase_db_url)
            return True
        except Exception as e:
            logger.error("Firebase init failed: %s", e)
            return False

    def _init_mqtt(self) -> bool:
        """Initialize MQTT client and connect."""
        try:
            self._mqtt_client = mqtt.Client()
            self._mqtt_client.on_connect = self._on_mqtt_connect
            self._mqtt_client.on_disconnect = self._on_mqtt_disconnect
            self._mqtt_client.connect(self.mqtt_host, self.mqtt_port, keepalive=60)
            self._mqtt_client.loop_start()
            return True
        except Exception as e:
            logger.error("MQTT init failed: %s", e)
            return False

    def _on_mqtt_connect(self, client: mqtt.Client, userdata: Any, flags: Dict, rc: int) -> None:
        if rc == 0:
            logger.info("MQTT connected to %s:%d", self.mqtt_host, self.mqtt_port)
        else:
            logger.warning("MQTT connect failed rc=%d", rc)

    def _on_mqtt_disconnect(self, client: mqtt.Client, userdata: Any, rc: int) -> None:
        logger.warning("MQTT disconnected rc=%d", rc)

    def _on_command_received(self, event: Any) -> None:
        """
        Firebase listener callback when a new command is written to /commands/*.
        """
        if event.data is None:
            return

        path = event.path
        data = event.data

        logger.info("Firebase command received at %s", path)
        logger.debug("Data: %s", json.dumps(data, indent=2))

        # Handle different formats
        if isinstance(data, dict):
            # Could be a single command or a dict of commands
            if "cmd" in data:
                self._forward_command(data)
            else:
                # Iterate over nested commands (e.g., when path is "/" and there are multiple push IDs)
                for key, value in data.items():
                    if isinstance(value, dict) and "cmd" in value:
                        self._forward_command(value)

    def _forward_command(self, command: Dict[str, Any]) -> None:
        """
        Forward a command to MQTT control topic for the ESP32.
        """
        if self._mqtt_client is None:
            logger.error("MQTT client not initialized")
            return

        cmd_type = command.get("cmd", "")
        
        # Transform to format expected by ESP32
        mqtt_payload = {
            "command": cmd_type,
        }

        # Add test_case_id if present (for SET_TEST_MODE)
        if "test_case_id" in command:
            mqtt_payload["test_case_id"] = command["test_case_id"]

        # Add any other fields
        for key in ["deviceId", "target", "floorId"]:
            if key in command:
                mqtt_payload[key] = command[key]

        payload_str = json.dumps(mqtt_payload)
        
        logger.info("Forwarding to MQTT %s: %s", MQTT_CONTROL_TOPIC, payload_str)
        self._mqtt_client.publish(MQTT_CONTROL_TOPIC, payload_str, qos=1)

    def start(self) -> bool:
        """Start the command forwarder."""
        if not self._init_firebase():
            return False

        if not self._init_mqtt():
            return False

        # Listen to /commands for new entries
        commands_ref = db.reference("/commands")
        commands_ref.listen(self._on_command_received)
        
        logger.info("Command Forwarder started. Listening on /commands...")
        self._running = True
        return True

    def stop(self) -> None:
        """Stop the forwarder."""
        self._running = False
        if self._mqtt_client:
            self._mqtt_client.loop_stop()
            self._mqtt_client.disconnect()
        logger.info("Command Forwarder stopped.")


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(description="Forward Firebase RTDB commands to MQTT")
    parser.add_argument(
        "--firebase-cred",
        default="secrets/firebase_cred.json",
        help="Path to Firebase service account JSON",
    )
    parser.add_argument(
        "--firebase-db-url",
        required=True,
        help="Firebase Realtime Database URL",
    )
    parser.add_argument(
        "--mqtt-host",
        default="192.168.0.5",
        help="MQTT broker host",
    )
    parser.add_argument(
        "--mqtt-port",
        type=int,
        default=1883,
        help="MQTT broker port",
    )
    args = parser.parse_args()

    forwarder = CommandForwarder(
        firebase_cred_path=args.firebase_cred,
        firebase_db_url=args.firebase_db_url,
        mqtt_host=args.mqtt_host,
        mqtt_port=args.mqtt_port,
    )

    if not forwarder.start():
        return 1

    try:
        # Keep running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        forwarder.stop()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

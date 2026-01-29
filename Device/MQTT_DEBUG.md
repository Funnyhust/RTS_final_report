# MQTT Debug Info

## 1. Topics
ESP32 publishes to the following topics. Please ensure your server/client is subscribed to these:

| Topic | Purpose | Frequency | QoS |
| :--- | :--- | :--- | :--- |
| **`fire_system/sensor/data`** | Normal sensor readings | Every 5s | 1 |
| **`fire_system/alert`** | Fire alarm alerts | Event-driven (Immediate) | 2 |
| **`fire_system/status`** | System heartbeat/connectivity | Every 30s | 0 |

**Recommendation:** Subscribe to `fire_system/#` on your debugging tool (MQTT Explorer / Mosquitto) to see all messages.

## 2. JSON Payload Examples

### Sensor Data (`fire_system/sensor/data`)
```json
{
  "timestamp": 12345000,
  "smoke": 0.1,
  "temperature": 0.2,
  "ir_flame": false,
  "gas": 0.05,
  "fire_detected": false
}
```

### Alert (`fire_system/alert`)
```json
{
  "type": "fire_alert",
  "detected": true,
  "timestamp": 12345678,
  "smoke": 0.9,
  "temperature": 0.8,
  "ir_flame": true,
  "gas": 0.1
}
```

## 3. Checklist
1. Are you subscribed to the correct topic? (Try wildcard `#`).
2. Is the Broker IP `192.168.0.5` correct?
3. Is your firewall blocking port 1883?

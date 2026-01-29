
import time
import json
import sys
import threading
import statistics
import paho.mqtt.client as mqtt

# Configuration
BROKER = "localhost"
PORT = 1883
TOPIC_CONTROL = "fire_system/control"
TOPIC_TELEMETRY = "fire_system/sensor/data"
TOPIC_ALARM = "fire_system/alert"

# Test IDs (Must match C header)
TEST_WCET     = 0x11
TEST_JITTER   = 0x12
TEST_BURST    = 0x14
TEST_NORMAL   = 0x00

results = {
    "latencies": [],
    "packets_received": 0,
    "start_time": 0
}

def on_connect(client, userdata, flags, rc):
    print(f"[*] Connected/Reconnected to Broker (RC: {rc})")
    client.subscribe([(TOPIC_TELEMETRY, 0), (TOPIC_ALARM, 2)])

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        
        # Calculate Latency (Server Time - Sensor Time)
        t_sensor = payload.get("t_sensor_ms", 0)
        t_rx = time.time() * 1000 # Python Receive Time
        
        if t_sensor > 0:
            latency = t_rx - t_sensor
            if 0 <= latency < 2000: # Filter outliers
                results["latencies"].append(latency)
        
        results["packets_received"] += 1
        # print(f".", end="", flush=True) # Progress dot
        
    except Exception as e:
        print(f"[!] Error parsing msg: {e}")

def run_test_case(client, test_name, test_id, duration_sec):
    print(f"\n==============================================")
    print(f"RUNNING TEST: {test_name} (ID: 0x{test_id:02X})")
    print(f"==============================================")
    
    # 1. Clear previous stats
    results["latencies"] = []
    results["packets_received"] = 0
    results["start_time"] = time.time()
    
    # 2. Send Command to ESP32
    print(f"[*] Sending SET_TEST_MODE command...")
    cmd = {
        "device_id": "PC_TEST_RUNNER",
        "cmd": "SET_TEST_MODE",
        "test_case_id": test_id
    }
    client.publish(TOPIC_CONTROL, json.dumps(cmd), qos=1)
    
    # 3. Wait for Reboot & Execution
    print(f"[*] Waiting for ESP32 to reboot and run (Duration: {duration_sec}s)...")
    time.sleep(duration_sec)
    
    # 4. Analyze Results
    count = len(results["latencies"])
    total_pkts = results["packets_received"]
    
    print(f"\n--- REPORT: {test_name} ---")
    print(f"Total Packets Rx: {total_pkts}")
    
    if count > 0:
        avg_lat = statistics.mean(results["latencies"])
        max_lat = max(results["latencies"])
        print(f"AVG Latency: {avg_lat:.2f} ms")
        print(f"MAX Latency: {max_lat:.2f} ms")
        
        # Pass/Fail Criteria logic
        if test_id == TEST_BURST and total_pkts < 20:
             print("[FAIL] Packet Loss Detected (Expected ~20 bursts)")
        elif avg_lat > 100: 
             print("[WARNING] High Latency Detected")
        else:
             print("[PASS] Performance Criteria Met")
    else:
        print("[WARNING] No valid measurement data received (Check MQTT/WiFi)")

def main():
    client = mqtt.Client(client_id="AUTO_TEST_RUNNER")
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        
        # Wait a bit for connection
        time.sleep(1)
        
        # --- EXECUTE SUITE ---
        # 1. Normal/WCRT Test
        run_test_case(client, "RTS-01: WCRT & Latency", TEST_WCET, duration_sec=10)
        
        # 2. Burst Test
        run_test_case(client, "RTS-04: Burst Handling", TEST_BURST, duration_sec=10)
        
        # 3. Return to Normal
        run_test_case(client, "Restoring Normal Mode", TEST_NORMAL, duration_sec=5)
        
        print("\n[DONE] All tests completed.")
        client.loop_stop()
        
    except Exception as e:
        print(f"Connection Error: {e}")
        print("Make sure Mosquitto is running!")

if __name__ == "__main__":
    main()

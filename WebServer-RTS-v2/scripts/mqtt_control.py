#!/usr/bin/env python3
import argparse
import json
import random
import time
import sys
import os

# Add local src to path to import common modules if needed, or just use minimal dependency
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Error: paho-mqtt is required. Install it using: pip install paho-mqtt")
    sys.exit(1)

# Default Configuration
DEFAULT_BROKER = "192.168.0.5"  # Modify if needed or use --host
DEFAULT_PORT = 1883
TOPIC_CONTROL = "fire_system/control"

# Test Case Mapping (From TEST_MODE_VIA_WEB.md)
TEST_CASES = {
    # RTS
    "NORMAL": 0x00,
    "RTS-01": 0x01, "WCRT": 0x01,
    "RTS-02": 0x02, "JITTER": 0x02,
    "RTS-03": 0x03, "LAG": 0x03,
    "RTS-04": 0x04, "BURST": 0x04,
    "RTS-05": 0x05, "ASYNC": 0x05,
    # BSC
    "BSC-01": 0x11, "SMOKE": 0x11,
    "BSC-02": 0x12, "FLAME": 0x12,
    "BSC-03": 0x13, "MULTI": 0x13,
    "BSC-04": 0x14, "OFFLINE": 0x14,
    "BSC-05": 0x15, "RESET": 0x15,
    "BSC-06": 0x16, "RECONNECT": 0x16,
    "BSC-07": 0x17, "QOS2": 0x17,
    "BSC-08": 0x18, "HEARTBEAT": 0x18,
}

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[+] Connected to MQTT Broker at {client._host}:{client._port}")
    else:
        print(f"[-] Failed to connect, return code {rc}")

def send_command(args):
    client = mqtt.Client(client_id=f"ctrl_script_{random.randint(1000,9999)}")
    client.on_connect = on_connect
    
    try:
        client.connect(args.host, args.port, 60)
        client.loop_start()
        time.sleep(1) # Wait for connection
        
        payload = {}
        
        # Mode 1: Set Test Case
        if args.mode:
            mode_key = args.mode.upper()
            if mode_key.startswith("0X"):
                try:
                    tid = int(mode_key, 16)
                except:
                    print(f"[-] Invalid hex ID: {mode_key}")
                    return
            elif mode_key in TEST_CASES:
                tid = TEST_CASES[mode_key]
            else:
                try:
                    tid = int(mode_key)
                except:
                    print(f"[-] Unknown mode name: {mode_key}")
                    print(f"Available modes: {', '.join(sorted(TEST_CASES.keys()))}")
                    return

            print(f"[>] Switching ESP32 to Test Case ID: 0x{tid:02X}")
            payload = {
                "command": "SET_TEST_MODE",
                "test_case_id": tid
            }

        # Mode 2: Simple Command (Buzzer)
        elif args.cmd:
            cmd = args.cmd.lower()
            valid_cmds = ["buzzer_on", "buzzer_off", "test_alarm"]
            
            # Map friendly names
            if cmd == "on": cmd = "buzzer_on"
            elif cmd == "off": cmd = "buzzer_off"
            elif cmd == "test": cmd = "test_alarm"
            
            if cmd not in valid_cmds:
                print(f"[-] Invalid command: {cmd}. Use: {', '.join(valid_cmds)}")
                return
                
            print(f"[>] Sending command: {cmd}")
            payload = {
                "command": cmd
            }
        
        else:
            print("[-] No action specified. Use --mode or --cmd")
            return

        # Publish
        json_payload = json.dumps(payload)
        info = client.publish(TOPIC_CONTROL, json_payload, qos=1)
        info.wait_for_publish()
        print(f"[+] Message sent to {TOPIC_CONTROL}: {json_payload}")
        
        time.sleep(1) # Wait for network
        client.loop_stop()
        client.disconnect()
        
    except Exception as e:
        print(f"[-] Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MQTT Control Script for ESP32 Fire System")
    parser.add_argument("--host", default=DEFAULT_BROKER, help=f"MQTT Broker Host (default: {DEFAULT_BROKER})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"MQTT Broker Port (default: {DEFAULT_PORT})")
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--mode", help="Switch Test Case (Name or ID, e.g., RTS-01, SMOKE, 0x11)")
    group.add_argument("--cmd", help="Send command (buzzer_on, buzzer_off, test_alarm)")
    
    args = parser.parse_args()
    send_command(args)

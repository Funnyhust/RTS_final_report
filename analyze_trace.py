
import csv
import statistics
import sys
import os

LOG_FILE = "d:/Duong/RTS_Lab/Project/WebServer-RTS-v2/results/live_server/trace_events.csv"

def analyze():
    latencies = []
    
    if not os.path.exists(LOG_FILE):
        print("Log file not found.")
        return

    try:
        with open(LOG_FILE, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Latency = t_pc_rx_ms - t_sensor_ms
                    t_rx = float(row.get('t_pc_rx_ms', 0))
                    t_sensor = float(row.get('t_sensor_ms', 0))
                    if t_rx > 0 and t_sensor > 0:
                        lat = t_rx - t_sensor
                        # Filter weird negative or huge values from clock skew if any
                        if 0 <= lat < 10000: 
                            latencies.append(lat)
                except ValueError:
                    continue
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    if not latencies:
        print("No valid data points found.")
        return

    avg_lat = statistics.mean(latencies)
    p95_lat = statistics.quantiles(latencies, n=20)[18] # 95th percentile
    max_lat = max(latencies)
    min_lat = min(latencies)
    
    print(f"Count: {len(latencies)}")
    print(f"AVG: {avg_lat:.2f}")
    print(f"P95: {p95_lat:.2f}")
    print(f"MIN: {min_lat:.2f}")
    print(f"MAX: {max_lat:.2f}")

if __name__ == "__main__":
    analyze()

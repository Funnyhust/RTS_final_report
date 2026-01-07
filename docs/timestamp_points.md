# Timestamp Points and KPI Formulas

## Timestamp Points (per message)
- t_sensor_ms: timestamp from payload (if available)
- t_pc_rx_ms: time when PC receives MQTT message
- t_proc_start_ms / t_proc_end_ms: processing start/end for rule engine
- t_db_enqueue_ms: time when DB write is enqueued
- t_db_ack_ms: time when DB write ACK is received
- t_dashboard_emit_ms: time when data is emitted to dashboard/console

## Derived Metrics
- end_to_end_ms = t_dashboard_emit_ms - (t_sensor_ms if present else t_pc_rx_ms)
- db_time_ms = t_db_ack_ms - t_db_enqueue_ms (if ACK exists)
- non_db_time_ms = t_dashboard_emit_ms - t_pc_rx_ms - db_time_ms (if ACK exists)
- deadline_miss = 1 if end_to_end_ms > deadline_ms else 0
- is_fresh = 1 if (t_dashboard_emit_ms - ts_ms) <= avi_ms else 0

## KPI Outputs
- deadline miss rate (alarm, telemetry)
- p50/p95/p99 end-to-end latency (alarm, telemetry)
- jitter = p99 - p50 (alarm, telemetry)
- db_time p95/p99
- freshness ratios (state, telemetry)

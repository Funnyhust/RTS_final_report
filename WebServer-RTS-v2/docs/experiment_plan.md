# Experiment Plan

## Goal
Compare baseline (sync DB writes in critical path) vs improved (async DB writer, drop/keep-latest, batching) under normal and stress conditions.

## Baseline
- rtdb.write_mode = sync
- Telemetry is not dropped
- DB write ACK blocks dashboard emit
- Expected: higher latency and jitter under burst

## Improved
- rtdb.write_mode = async with writer thread
- Priority: alarm > state > telemetry
- Telemetry drop/keep-latest and batching
- Backpressure on telemetry during overload
- Optional feedback: collector writes feedback.json from freshness ratio; simulator can adapt rate
- Expected: improved p99 alarm latency and lower deadline miss rate

## Stress Case
- Burst telemetry for 10s at high rate
- Inject telemetry jitter in processing pipeline
- Verify: improved config preserves alarm timeliness vs baseline

## Outputs
- trace_final.csv with timestamp points and derived metrics
- summary.json and summary.csv with KPIs

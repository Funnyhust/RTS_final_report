import time

def wall_ms() -> int:
    return int(time.time() * 1000)

def monotonic_ms() -> int:
    return int(time.monotonic() * 1000)

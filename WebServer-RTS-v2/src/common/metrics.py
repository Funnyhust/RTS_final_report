from typing import Iterable, List, Optional


def _sorted(values: Iterable[float]) -> List[float]:
    return sorted([v for v in values if v is not None])


def percentile(values: Iterable[float], p: float) -> Optional[float]:
    vals = _sorted(values)
    if not vals:
        return None
    if p <= 0:
        return vals[0]
    if p >= 100:
        return vals[-1]
    k = (len(vals) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(vals) - 1)
    if f == c:
        return vals[f]
    d = k - f
    return vals[f] + (vals[c] - vals[f]) * d


def jitter(values: Iterable[float]) -> Optional[float]:
    p50 = percentile(values, 50)
    p99 = percentile(values, 99)
    if p50 is None or p99 is None:
        return None
    return p99 - p50


def miss_rate(values: Iterable[float], deadline_ms: float) -> Optional[float]:
    vals = [v for v in values if v is not None]
    if not vals:
        return None
    misses = sum(1 for v in vals if v > deadline_ms)
    return misses / len(vals)


def freshness_ratio(flags: Iterable[int]) -> Optional[float]:
    vals = list(flags)
    if not vals:
        return None
    fresh = sum(1 for v in vals if v == 1)
    return fresh / len(vals)

"""Earnings Analyzer — analyzes earnings data and post-earnings drift."""
from __future__ import annotations
import math
from datetime import datetime
from app.models.schemas import OHLCV


def analyze_earnings(
    ticker: str,
    data: list[OHLCV],
    earnings_date: str | None = None,
    reported_eps: float | None = None,
    expected_eps: float | None = None,
    revenue: float | None = None,
) -> dict:
    closes = [d.close for d in data]
    volumes = [d.volume for d in data]

    if len(closes) < 2:
        return {"ticker": ticker, "error": "Insufficient data"}

    current = closes[-1]

    # Post-earnings drift simulation
    surprise_pct = None
    if reported_eps is not None and expected_eps is not None and expected_eps != 0:
        surprise_pct = ((reported_eps - expected_eps) / abs(expected_eps)) * 100

    # Price reaction around earnings (if date provided)
    price_reaction = None
    if earnings_date and len(data) >= 5:
        date_strs = [d.date for d in data]
        try:
            idx = next(i for i, d in enumerate(date_strs) if d >= earnings_date)
            if idx > 0 and idx < len(closes):
                pre_close = closes[idx - 1]
                post_close = closes[idx] if idx < len(closes) else closes[-1]
                price_reaction = ((post_close - pre_close) / pre_close) * 100
        except StopIteration:
            pass

    # Volume analysis around earnings
    avg_vol = sum(volumes[-20:]) / min(20, len(volumes)) if volumes else 0
    recent_vol = volumes[-1] if volumes else 0
    vol_spike = recent_vol / avg_vol if avg_vol > 0 else 1.0

    # Historical earnings drift pattern
    drift_analysis = None
    if len(closes) >= 30:
        returns_5d = [(closes[i] / closes[i - 5]) - 1 for i in range(5, len(closes))]
        returns_1d = [(closes[i] / closes[i - 1]) - 1 for i in range(1, len(closes))]

        avg_5d = sum(returns_5d) / len(returns_5d) * 100 if returns_5d else 0
        avg_1d = sum(returns_1d) / len(returns_1d) * 100 if returns_1d else 0
        vol_of_vol = _std_dev(returns_1d) * 100 if returns_1d else 0

        drift_analysis = {
            "avg_1d_return": round(avg_1d, 3),
            "avg_5d_return": round(avg_5d, 3),
            "volatility_of_returns": round(vol_of_vol, 3),
            "positive_days_pct": round(sum(1 for r in returns_1d if r > 0) / len(returns_1d) * 100, 1) if returns_1d else 50,
        }

    # Expectations
    expectations = {
        "surprise_pct": round(surprise_pct, 2) if surprise_pct is not None else None,
        "beat": surprise_pct > 0 if surprise_pct is not None else None,
        "magnitude": _surprise_magnitude(surprise_pct) if surprise_pct is not None else None,
    }

    # Post-earnings assessment
    assessment_parts = []
    if surprise_pct is not None:
        if surprise_pct > 10:
            assessment_parts.append(f"Significant earnings beat of {surprise_pct:.1f}%")
        elif surprise_pct > 0:
            assessment_parts.append(f"Modest earnings beat of {surprise_pct:.1f}%")
        elif surprise_pct < -10:
            assessment_parts.append(f"Significant earnings miss of {surprise_pct:.1f}%")
        elif surprise_pct < 0:
            assessment_parts.append(f"Modest earnings miss of {surprise_pct:.1f}%")
        else:
            assessment_parts.append("Earnings in line with expectations")

    if vol_spike > 2:
        assessment_parts.append(f"Volume {vol_spike:.1f}x above average around earnings")
    if price_reaction is not None:
        direction = "up" if price_reaction > 0 else "down"
        assessment_parts.append(f"Price moved {direction} {abs(price_reaction):.1f}% on earnings day")

    return {
        "ticker": ticker,
        "current_price": current,
        "earnings_date": earnings_date,
        "expectations": expectations,
        "price_reaction": round(price_reaction, 2) if price_reaction is not None else None,
        "volume_spike": round(vol_spike, 2),
        "drift_analysis": drift_analysis,
        "assessment": ". ".join(assessment_parts) + "." if assessment_parts else "No earnings data available.",
        "generated_at": datetime.utcnow().isoformat(),
    }


def _std_dev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((v - mean) ** 2 for v in values) / (len(values) - 1))


def _surprise_magnitude(pct: float | None) -> str:
    if pct is None:
        return "unknown"
    abs_pct = abs(pct)
    if abs_pct > 20:
        return "massive"
    elif abs_pct > 10:
        return "significant"
    elif abs_pct > 5:
        return "moderate"
    elif abs_pct > 0:
        return "minor"
    return "in_line"

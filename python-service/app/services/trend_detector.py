"""Trend Detector — identifies trends, patterns, and momentum shifts in price data."""
from __future__ import annotations
import math
from datetime import datetime
from app.models.schemas import OHLCV


def _linear_regression(values: list[float]) -> tuple[float, float]:
    n = len(values)
    if n < 2:
        return 0.0, values[-1] if values else 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    den = sum((i - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0.0
    intercept = y_mean - slope * x_mean
    return slope, intercept


def _r_squared(values: list[float], slope: float, intercept: float) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    y_mean = sum(values) / n
    ss_tot = sum((v - y_mean) ** 2 for v in values)
    ss_res = sum((v - (slope * i + intercept)) ** 2 for i, v in enumerate(values))
    return 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0


def _pivot_points(high: float, low: float, close: float) -> dict:
    pp = (high + low + close) / 3
    r1 = 2 * pp - low
    s1 = 2 * pp - high
    r2 = pp + (high - low)
    s2 = pp - (high - low)
    r3 = high + 2 * (pp - low)
    s3 = low - 2 * (high - pp)
    return {
        "pivot": round(pp, 2),
        "r1": round(r1, 2), "r2": round(r2, 2), "r3": round(r3, 2),
        "s1": round(s1, 2), "s2": round(s2, 2), "s3": round(s3, 2),
    }


def detect_trends(ticker: str, data: list[OHLCV]) -> dict:
    if len(data) < 10:
        return {"ticker": ticker, "trends": [], "patterns": [], "momentum": {}}

    closes = [d.close for d in data]
    highs = [d.high for d in data]
    lows = [d.low for d in data]
    volumes = [d.volume for d in data]

    trends = []
    patterns = []

    # Short-term trend (10-day)
    slope10, intercept10 = _linear_regression(closes[-10:])
    r2_10 = _r_squared(closes[-10:], slope10, intercept10)
    daily_pct = (slope10 / closes[-1]) * 100 if closes[-1] != 0 else 0
    trends.append({
        "period": "short_term",
        "days": 10,
        "direction": "up" if slope10 > 0 else "down",
        "slope_pct_per_day": round(daily_pct, 4),
        "strength": round(r2_10, 3),
    })

    # Medium-term trend (30-day)
    if len(closes) >= 30:
        slope30, intercept30 = _linear_regression(closes[-30:])
        r2_30 = _r_squared(closes[-30:], slope30, intercept30)
        daily_pct30 = (slope30 / closes[-1]) * 100 if closes[-1] != 0 else 0
        trends.append({
            "period": "medium_term",
            "days": 30,
            "direction": "up" if slope30 > 0 else "down",
            "slope_pct_per_day": round(daily_pct30, 4),
            "strength": round(r2_30, 3),
        })

    # Long-term trend (90-day)
    if len(closes) >= 90:
        slope90, intercept90 = _linear_regression(closes[-90:])
        r2_90 = _r_squared(closes[-90:], slope90, intercept90)
        daily_pct90 = (slope90 / closes[-1]) * 100 if closes[-1] != 0 else 0
        trends.append({
            "period": "long_term",
            "days": 90,
            "direction": "up" if slope90 > 0 else "down",
            "slope_pct_per_day": round(daily_pct90, 4),
            "strength": round(r2_90, 3),
        })

    # Multi-year trend (5-year ≈ 1260 days)
    if len(closes) >= 1260:
        slope5y, intercept5y = _linear_regression(closes[-1260:])
        r2_5y = _r_squared(closes[-1260:], slope5y, intercept5y)
        daily_pct5y = (slope5y / closes[-1]) * 100 if closes[-1] != 0 else 0
        annual_pct5y = daily_pct5y * 252
        trends.append({
            "period": "5_year",
            "days": 1260,
            "direction": "up" if slope5y > 0 else "down",
            "slope_pct_per_day": round(daily_pct5y, 4),
            "annual_return_pct": round(annual_pct5y, 2),
            "strength": round(r2_5y, 3),
        })

    # Full history trend (19-year ≈ 4788 days)
    if len(closes) >= 4788:
        slope10y, intercept10y = _linear_regression(closes[-4788:])
        r2_10y = _r_squared(closes[-4788:], slope10y, intercept10y)
        daily_pct10y = (slope10y / closes[-1]) * 100 if closes[-1] != 0 else 0
        annual_pct10y = daily_pct10y * 252
        trends.append({
            "period": "10_year",
            "days": 2520,
            "direction": "up" if slope10y > 0 else "down",
            "slope_pct_per_day": round(daily_pct10y, 4),
            "annual_return_pct": round(annual_pct10y, 2),
            "strength": round(r2_10y, 3),
        })

    # Pattern detection
    if len(closes) >= 5:
        last5 = closes[-5:]
        if all(last5[i] < last5[i + 1] for i in range(4)):
            patterns.append({"pattern": "ascending", "confidence": 0.8, "description": "5 consecutive higher closes"})
        elif all(last5[i] > last5[i + 1] for i in range(4)):
            patterns.append({"pattern": "descending", "confidence": 0.8, "description": "5 consecutive lower closes"})

    if len(closes) >= 3:
        if closes[-1] > closes[-2] > closes[-3]:
            patterns.append({"pattern": "bullish_momentum", "confidence": 0.6, "description": "Accelerating upward movement"})
        elif closes[-1] < closes[-2] < closes[-3]:
            patterns.append({"pattern": "bearish_momentum", "confidence": 0.6, "description": "Accelerating downward movement"})

    # Volume divergence
    if len(volumes) >= 10 and len(closes) >= 10:
        price_up = closes[-1] > closes[-10]
        vol_up = sum(volumes[-3:]) / 3 > sum(volumes[-10:-7]) / 3
        if price_up and not vol_up:
            patterns.append({"pattern": "bearish_divergence", "confidence": 0.5, "description": "Price rising on declining volume"})
        elif not price_up and vol_up:
            patterns.append({"pattern": "accumulation", "confidence": 0.5, "description": "Price falling on increasing volume"})

    # Multi-year patterns
    if len(closes) >= 1260:
        all_time_high = max(highs)
        all_time_low = min(lows)
        current = closes[-1]
        pct_from_ath = ((current - all_time_high) / all_time_high) * 100 if all_time_high > 0 else 0
        pct_from_atl = ((current - all_time_low) / all_time_low) * 100 if all_time_low > 0 else 0

        if abs(pct_from_ath) < 5:
            patterns.append({"pattern": "near_all_time_high", "confidence": 0.7, "description": f"Within {abs(pct_from_ath):.1f}% of 5-year ATH (${all_time_high:.2f})"})
        if abs(pct_from_atl) < 10 and current > all_time_low * 1.15:
            patterns.append({"pattern": "recovery_from_low", "confidence": 0.6, "description": f"Recovering from 5-year low (${all_time_low:.2f}), +{pct_from_atl:.1f}%"})

        # 52-week range position
        year_high = max(highs[-252:])
        year_low = min(lows[-252:])
        range_pos = ((current - year_low) / (year_high - year_low)) * 100 if year_high != year_low else 50
        if range_pos > 90:
            patterns.append({"pattern": "52wk_high_zone", "confidence": 0.7, "description": f"In top 10% of 52-week range ({range_pos:.0f}%)"})
        elif range_pos < 10:
            patterns.append({"pattern": "52wk_low_zone", "confidence": 0.7, "description": f"In bottom 10% of 52-week range ({range_pos:.0f}%)"})

    # Decade-level support/resistance
    if len(closes) >= 2520:
        year_closes = closes[-4788:]
        # Find significant price levels (cluster detection)
        sorted_prices = sorted(set(round(p, 0) for p in year_closes))
        clusters = []
        for price in sorted_prices:
            count = sum(1 for p in year_closes if abs(p - price) / price < 0.02)
            if count > len(year_closes) * 0.05:
                clusters.append({"price": round(price, 2), "touches": count})
        clusters.sort(key=lambda x: x["touches"], reverse=True)
        if len(clusters) >= 2:
            patterns.append({
                "pattern": "decade_support_resistance",
                "confidence": 0.6,
                "description": f"Key levels at ${clusters[0]['price']:.0f} ({clusters[0]['touches']} touches) and ${clusters[1]['price']:.0f} ({clusters[1]['touches']} touches)",
                "support": clusters[-1]["price"],
                "resistance": clusters[0]["price"],
            })

        # Long-term momentum shift (200-day vs 500-day SMA)
        sma200_now = sum(closes[-200:]) / 200
        sma500_now = sum(closes[-500:]) / 500
        sma200_1y_ago = sum(closes[-452:-200]) / 252 if len(closes) > 452 else sma200_now
        sma500_1y_ago = sum(closes[-752:-500]) / 252 if len(closes) > 752 else sma500_now

        if sma200_now > sma500_now and sma200_1y_ago <= sma500_1y_ago:
            patterns.append({"pattern": "secular_bull_shift", "confidence": 0.8, "description": "200-day SMA crossed above 500-day SMA — secular bull signal"})
        elif sma200_now < sma500_now and sma200_1y_ago >= sma500_1y_ago:
            patterns.append({"pattern": "secular_bear_shift", "confidence": 0.8, "description": "200-day SMA crossed below 500-day SMA — secular bear signal"})

    # Momentum
    rsi_period = min(14, len(closes) - 1)
    if rsi_period >= 5:
        deltas = [closes[i] - closes[i - 1] for i in range(-rsi_period, 0)]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        avg_gain = sum(gains) / rsi_period
        avg_loss = sum(losses) / rsi_period
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi = 100 - (100 / (1 + rs))
    else:
        rsi = 50.0

    roc = ((closes[-1] / closes[-min(10, len(closes))]) - 1) * 100 if len(closes) >= 2 else 0

    # Long-term returns
    cagr = None
    total_return = None
    if len(closes) >= 4788:
        total_return = ((closes[-1] / closes[-4788]) - 1) * 100
        cagr = ((closes[-1] / closes[-4788]) ** (1 / 19) - 1) * 100
    elif len(closes) >= 1260:
        total_return = ((closes[-1] / closes[-1260]) - 1) * 100
        cagr = ((closes[-1] / closes[-1260]) ** (1 / 5) - 1) * 100

    # Longest available ROC
    roc_long = roc
    if len(closes) >= 4788:
        roc_long = ((closes[-1] / closes[-4788]) - 1) * 100
    elif len(closes) >= 1260:
        roc_long = ((closes[-1] / closes[-1260]) - 1) * 100

    momentum = {
        "rsi_14": round(rsi, 2),
        "roc_10d": round(roc, 2),
        "momentum_score": round((rsi - 50) / 50, 3),
        "roc_long_pct": round(roc_long, 2),
        "total_return_pct": round(total_return, 2) if total_return is not None else None,
        "cagr_pct": round(cagr, 2) if cagr is not None else None,
    }

    # Support/Resistance from pivots
    recent_high = max(highs[-20:]) if len(highs) >= 20 else max(highs)
    recent_low = min(lows[-20:]) if len(lows) >= 20 else min(lows)
    pivots = _pivot_points(recent_high, recent_low, closes[-1])

    return {
        "ticker": ticker,
        "trends": trends,
        "patterns": patterns,
        "momentum": momentum,
        "support_resistance": pivots,
        "current_price": closes[-1],
        "generated_at": datetime.utcnow().isoformat(),
    }

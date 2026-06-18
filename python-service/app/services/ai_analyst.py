"""AI Analyst — generates comprehensive stock analysis reports using heuristic models."""
from __future__ import annotations
import math
from datetime import datetime
from app.models.schemas import OHLCV


def _sma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period


def _ema(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    k = 2 / (period + 1)
    ema = sum(closes[:period]) / period
    for price in closes[period:]:
        ema = price * k + ema * (1 - k)
    return ema


def _rsi(closes: list[float], period: int = 14) -> float | None:
    if len(closes) < period + 1:
        return None
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas[-period:]]
    losses = [-d if d < 0 else 0 for d in deltas[-period:]]
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _macd(closes: list[float]) -> tuple[float, float, float] | None:
    if len(closes) < 26:
        return None
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    if ema12 is None or ema26 is None:
        return None
    macd_line = ema12 - ema26
    signal = _ema(closes[-9:], 9) or macd_line * 0.8
    histogram = macd_line - signal
    return macd_line, signal, histogram


def _bollinger(closes: list[float], period: int = 20) -> tuple[float, float, float] | None:
    if len(closes) < period:
        return None
    sma = sum(closes[-period:]) / period
    variance = sum((c - sma) ** 2 for c in closes[-period:]) / period
    std = math.sqrt(variance)
    return sma + 2 * std, sma, sma - 2 * std


def _volume_trend(volumes: list[int]) -> str:
    if len(volumes) < 5:
        return "neutral"
    recent = sum(volumes[-3:]) / 3
    older = sum(volumes[-6:-3]) / 3 if len(volumes) >= 6 else recent
    if recent > older * 1.3:
        return "increasing"
    elif recent < older * 0.7:
        return "decreasing"
    return "stable"


def _volatility(closes: list[float], period: int = 20) -> float:
    if len(closes) < period + 1:
        return 0.0
    returns = [(closes[i] / closes[i - 1]) - 1 for i in range(-period, 0)]
    mean_ret = sum(returns) / len(returns)
    var = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
    return math.sqrt(var) * math.sqrt(252) * 100


def _trend_strength(closes: list[float]) -> float:
    if len(closes) < 20:
        return 0.0
    sma5 = _sma(closes, 5)
    sma20 = _sma(closes, 20)
    if sma5 is None or sma20 is None:
        return 0.0
    diff = (sma5 - sma20) / sma20
    return max(-1.0, min(1.0, diff * 10))


def generate_analysis(ticker: str, data: list[OHLCV]) -> dict:
    closes = [d.close for d in data]
    volumes = [d.volume for d in data]
    current = closes[-1] if closes else 0

    rsi = _rsi(closes)
    macd = _macd(closes)
    bb = _bollinger(closes)
    sma50 = _sma(closes, 50)
    sma200 = _sma(closes, 200)
    vol = _volatility(closes)
    trend = _trend_strength(closes)
    vol_trend = _volumes_trend(volumes)

    signals = []
    bullish = 0
    bearish = 0

    if rsi is not None:
        if rsi < 30:
            signals.append({"indicator": "RSI", "signal": "oversold", "direction": "bullish", "value": rsi})
            bullish += 1
        elif rsi > 70:
            signals.append({"indicator": "RSI", "signal": "overbought", "direction": "bearish", "value": rsi})
            bearish += 1
        else:
            signals.append({"indicator": "RSI", "signal": "neutral", "direction": "neutral", "value": rsi})

    if macd:
        ml, sl, hist = macd
        if hist > 0 and ml > sl:
            signals.append({"indicator": "MACD", "signal": "bullish crossover", "direction": "bullish", "value": hist})
            bullish += 1
        elif hist < 0 and ml < sl:
            signals.append({"indicator": "MACD", "signal": "bearish crossover", "direction": "bearish", "value": hist})
            bearish += 1
        else:
            signals.append({"indicator": "MACD", "signal": "neutral", "direction": "neutral", "value": hist})

    if bb:
        upper, mid, lower = bb
        if current <= lower:
            signals.append({"indicator": "Bollinger", "signal": "below lower band", "direction": "bullish", "value": current})
            bullish += 1
        elif current >= upper:
            signals.append({"indicator": "Bollinger", "signal": "above upper band", "direction": "bearish", "value": current})
            bearish += 1
        else:
            pct = (current - lower) / (upper - lower) if upper != lower else 0.5
            signals.append({"indicator": "Bollinger", "signal": f"{pct:.0%} of range", "direction": "neutral", "value": pct})

    if sma50 and sma200:
        if sma50 > sma200:
            signals.append({"indicator": "Golden Cross", "signal": "50 > 200 SMA", "direction": "bullish", "value": sma50 / sma200})
            bullish += 1
        else:
            signals.append({"indicator": "Death Cross", "signal": "50 < 200 SMA", "direction": "bearish", "value": sma50 / sma200})
            bearish += 1

    if vol_trend == "increasing":
        signals.append({"indicator": "Volume", "signal": "above average", "direction": "bullish", "value": 1.3})
        bullish += 0.5
    elif vol_trend == "decreasing":
        signals.append({"indicator": "Volume", "signal": "below average", "direction": "bearish", "value": 0.7})
        bearish += 0.5

    total = bullish + bearish
    bullish_pct = bullish / total if total > 0 else 0.5
    bearish_pct = bearish / total if total > 0 else 0.5

    if bullish_pct > 0.6:
        overall = "bullish"
        conviction = "strong" if bullish_pct > 0.75 else "moderate"
    elif bearish_pct > 0.6:
        overall = "bearish"
        conviction = "strong" if bearish_pct > 0.75 else "moderate"
    else:
        overall = "neutral"
        conviction = "low"

    support = min(closes[-20:]) if len(closes) >= 20 else current * 0.95
    resistance = max(closes[-20:]) if len(closes) >= 20 else current * 1.05

    summary_parts = []
    if rsi:
        if rsi > 70:
            summary_parts.append(f"RSI at {rsi:.1f} indicates overbought conditions")
        elif rsi < 30:
            summary_parts.append(f"RSI at {rsi:.1f} suggests oversold territory")
        else:
            summary_parts.append(f"RSI at {rsi:.1f} is neutral")
    if sma50 and sma200:
        cross = "golden cross" if sma50 > sma200 else "death cross"
        summary_parts.append(f"{cross} pattern on daily chart")
    summary_parts.append(f"Volatility is {vol:.1f}% annualized")
    summary_parts.append(f"Volume trend is {vol_trend}")

    return {
        "ticker": ticker,
        "overall_signal": overall,
        "conviction": conviction,
        "bullish_probability": round(bullish_pct, 3),
        "bearish_probability": round(bearish_pct, 3),
        "signals": signals,
        "support": round(support, 2),
        "resistance": round(resistance, 2),
        "volatility": round(vol, 2),
        "trend_strength": round(trend, 3),
        "volume_trend": vol_trend,
        "summary": ". ".join(summary_parts) + ".",
        "key_levels": {
            "support": round(support, 2),
            "resistance": round(resistance, 2),
            "sma_50": round(sma50, 2) if sma50 else None,
            "sma_200": round(sma200, 2) if sma200 else None,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


def _volumes_trend(volumes: list[int]) -> str:
    return _volume_trend(volumes)

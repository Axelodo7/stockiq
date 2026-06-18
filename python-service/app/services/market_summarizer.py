"""Market Summarizer — generates market-wide summaries from multiple stock data."""
from __future__ import annotations
import math
from datetime import datetime
from app.models.schemas import OHLCV


def summarize_market(stocks: dict[str, list[OHLCV]]) -> dict:
    """Generate a market summary from multiple stock OHLCV datasets."""
    summaries = {}
    gainers = []
    losers = []
    high_vol = []

    for ticker, data in stocks.items():
        if len(data) < 2:
            continue
        closes = [d.close for d in data]
        volumes = [d.volume for d in data]
        current = closes[-1]
        prev = closes[-2]
        change_pct = ((current - prev) / prev) * 100

        avg_vol = sum(volumes[-20:]) / min(20, len(volumes)) if volumes else 0
        recent_vol = volumes[-1] if volumes else 0
        vol_ratio = recent_vol / avg_vol if avg_vol > 0 else 1.0

        sma20 = sum(closes[-20:]) / min(20, len(closes)) if len(closes) >= 5 else current
        sma50 = sum(closes[-50:]) / min(50, len(closes)) if len(closes) >= 20 else current

        above_sma20 = current > sma20
        above_sma50 = current > sma50

        ret_5d = ((current / closes[-6]) - 1) * 100 if len(closes) >= 6 else 0
        ret_20d = ((current / closes[-21]) - 1) * 100 if len(closes) >= 21 else 0

        info = {
            "ticker": ticker,
            "price": round(current, 2),
            "change_pct": round(change_pct, 2),
            "ret_5d": round(ret_5d, 2),
            "ret_20d": round(ret_20d, 2),
            "above_sma20": above_sma20,
            "above_sma50": above_sma50,
            "volume_ratio": round(vol_ratio, 2),
        }
        summaries[ticker] = info

        if change_pct > 0:
            gainers.append(info)
        elif change_pct < 0:
            losers.append(info)
        if vol_ratio > 2.0:
            high_vol.append(info)

    gainers.sort(key=lambda x: x["change_pct"], reverse=True)
    losers.sort(key=lambda x: x["change_pct"])

    bullish_count = sum(1 for s in summaries.values() if s["above_sma20"] and s["above_sma50"])
    bearish_count = sum(1 for s in summaries.values() if not s["above_sma20"] and not s["above_sma50"])
    total = len(summaries) or 1

    avg_change = sum(s["change_pct"] for s in summaries.values()) / total
    avg_5d = sum(s["ret_5d"] for s in summaries.values()) / total
    avg_20d = sum(s["ret_20d"] for s in summaries.values()) / total

    if bullish_count / total > 0.6:
        sentiment = "bullish"
    elif bearish_count / total > 0.6:
        sentiment = "bearish"
    else:
        sentiment = "mixed"

    summary_parts = [
        f"Market sentiment is {sentiment} with {bullish_count}/{total} stocks above both SMAs.",
        f"Average daily change: {avg_change:+.2f}%.",
        f"5-day average return: {avg_5d:+.2f}%.",
    ]
    if high_vol:
        tickers = ", ".join(h["ticker"] for h in high_vol[:3])
        summary_parts.append(f"Unusual volume in: {tickers}.")

    return {
        "sentiment": sentiment,
        "avg_change_pct": round(avg_change, 2),
        "avg_5d_return": round(avg_5d, 2),
        "avg_20d_return": round(avg_20d, 2),
        "bullish_count": bullish_count,
        "bearish_count": bearish_count,
        "total_stocks": total,
        "top_gainers": gainers[:5],
        "top_losers": losers[:5],
        "unusual_volume": high_vol[:5],
        "individual": summaries,
        "summary": " ".join(summary_parts),
        "generated_at": datetime.utcnow().isoformat(),
    }

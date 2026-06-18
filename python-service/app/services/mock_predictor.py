import math
import hashlib
from datetime import datetime, timedelta


class MockPredictor:
    """Deterministic mock predictor that generates realistic predictions from OHLCV data."""

    MODEL_VERSIONS = {
        "LSTM": "1.0.0-mock",
        "TRANSFORMER": "1.0.0-mock",
        "XGBOOST": "1.0.0-mock",
        "RANDOM_FOREST": "1.0.0-mock",
        "ENSEMBLE": "1.0.0-mock",
    }

    FORECAST_WINDOWS = [
        {"days": 1, "label": "1D"},
        {"days": 3, "label": "3D"},
        {"days": 7, "label": "7D"},
        {"days": 14, "label": "14D"},
        {"days": 30, "label": "30D"},
        {"days": 90, "label": "90D"},
    ]

    def predict(self, ticker: str, data: list[dict]) -> dict:
        if len(data) < 10:
            return self._minimal_prediction(ticker, data)

        closes = [d["close"] for d in data]
        highs = [d["high"] for d in data]
        lows = [d["low"] for d in data]
        volumes = [d["volume"] for d in data]

        current_price = closes[-1]

        trend = self._compute_trend(closes)
        volatility = self._compute_volatility(closes)
        momentum = self._compute_momentum(closes)
        volume_signal = self._compute_volume_signal(volumes)
        rsi = self._compute_rsi(closes)
        bb_position = self._compute_bb_position(closes)

        direction = self._compute_direction(trend, momentum, rsi, bb_position)
        strength = min(abs(trend) + abs(momentum) * 0.5 + volume_signal * 0.3, 1.0)

        windows = []
        for wf in self.FORECAST_WINDOWS:
            days = wf["days"]
            horiz_vol = volatility * math.sqrt(days / 30)
            drift = direction * strength * horiz_vol * 0.6
            predicted_price = current_price * (1 + drift)
            confidence = self._compute_confidence(days, volatility, strength)

            windows.append({
                "days": days,
                "label": wf["label"],
                "price": round(predicted_price, 2),
                "confidence": round(confidence, 4),
                "changePercent": round((predicted_price / current_price - 1) * 100, 2),
            })

        risk = self._compute_risk(volatility, strength, rsi)
        agreement = self._compute_agreement(trend, momentum, rsi, volume_signal, bb_position)
        uncertainty = round(current_price * volatility * 1.5, 2)
        explainability = self._compute_explainability(trend, momentum, rsi, bb_position, volume_signal, volatility)

        return {
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "windows": windows,
            "risk": risk,
            "model_agreement": round(agreement, 4),
            "uncertainty": uncertainty,
            "explainability": explainability,
            "model_versions": self.MODEL_VERSIONS,
            "disclaimer": "Predictions are estimates for analytical purposes only. Not investment advice. Past performance does not guarantee future results.",
        }

    def _compute_trend(self, closes: list[float]) -> float:
        if len(closes) < 50:
            return 0.0
        sma_20 = sum(closes[-20:]) / 20
        sma_50 = sum(closes[-50:]) / 50
        price_vs_sma20 = (closes[-1] - sma_20) / sma_20 if sma_20 else 0
        sma_cross = (sma_20 - sma_50) / sma_50 if sma_50 else 0
        return max(min(price_vs_sma20 * 0.6 + sma_cross * 0.4, 1.0), -1.0)

    def _compute_volatility(self, closes: list[float]) -> float:
        if len(closes) < 20:
            return 0.02
        returns = [(closes[i] - closes[i - 1]) / closes[i - 1] for i in range(1, len(closes))]
        recent = returns[-20:]
        mean = sum(recent) / len(recent)
        variance = sum((r - mean) ** 2 for r in recent) / len(recent)
        return max(min(variance ** 0.5, 0.15), 0.005)

    def _compute_momentum(self, closes: list[float]) -> float:
        if len(closes) < 20:
            return 0.0
        roc_5 = (closes[-1] - closes[-5]) / closes[-5] if closes[-5] else 0
        roc_20 = (closes[-1] - closes[-20]) / closes[-20] if closes[-20] else 0
        return max(min((roc_5 * 0.6 + roc_20 * 0.4) * 5, 1.0), -1.0)

    def _compute_volume_signal(self, volumes: list[float]) -> float:
        if len(volumes) < 20:
            return 0.0
        avg_vol = sum(volumes[-20:]) / 20
        if avg_vol == 0:
            return 0.0
        recent_vol = sum(volumes[-5:]) / 5
        ratio = recent_vol / avg_vol
        return max(min((ratio - 1.0) * 2, 1.0), -1.0)

    def _compute_rsi(self, closes: list[float], period: int = 14) -> float:
        if len(closes) < period + 1:
            return 50.0
        gains = []
        losses = []
        for i in range(1, len(closes)):
            change = closes[i] - closes[i - 1]
            gains.append(max(change, 0))
            losses.append(max(-change, 0))
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return 100 - 100 / (1 + rs)

    def _compute_bb_position(self, closes: list[float], period: int = 20) -> float:
        if len(closes) < period:
            return 0.5
        window = closes[-period:]
        sma = sum(window) / period
        variance = sum((x - sma) ** 2 for x in window) / period
        std = variance ** 0.5
        if std == 0:
            return 0.5
        upper = sma + 2 * std
        lower = sma - 2 * std
        if upper == lower:
            return 0.5
        return max(min((closes[-1] - lower) / (upper - lower), 1.0), 0.0)

    def _compute_direction(self, trend: float, momentum: float, rsi: float, bb_pos: float) -> float:
        signals = []
        signals.append(trend)
        signals.append(momentum)
        if rsi < 30:
            signals.append(0.5)
        elif rsi > 70:
            signals.append(-0.5)
        else:
            signals.append((rsi - 50) / 50 * 0.3)
        bb_signal = (bb_pos - 0.5) * 0.4
        signals.append(bb_signal)
        return max(min(sum(signals) / len(signals), 1.0), -1.0)

    def _compute_confidence(self, days: int, volatility: float, strength: float) -> float:
        base = 0.85
        time_decay = max(0.3, 1.0 - (days / 180) * 0.5)
        vol_penalty = volatility * 2
        strength_bonus = strength * 0.15
        confidence = (base - vol_penalty + strength_bonus) * time_decay
        return max(min(confidence, 0.95), 0.25)

    def _compute_risk(self, volatility: float, strength: float, rsi: float) -> dict:
        vol_score = min(volatility / 0.05, 1.0)
        rsi_extreme = 0.0
        if rsi > 70:
            rsi_extreme = (rsi - 70) / 30
        elif rsi < 30:
            rsi_extreme = (30 - rsi) / 30
        trend_weakness = max(0, 1.0 - abs(strength))
        composite = vol_score * 0.4 + rsi_extreme * 0.3 + trend_weakness * 0.3

        if composite < 0.25:
            rating = "LOW"
        elif composite < 0.50:
            rating = "MEDIUM"
        elif composite < 0.75:
            rating = "HIGH"
        else:
            rating = "EXTREME"

        bullish = max(min(0.5 + strength * 0.4 - rsi_extreme * 0.2, 0.95), 0.05)
        return {
            "bullishProbability": round(bullish, 4),
            "bearishProbability": round(1.0 - bullish, 4),
            "volatilityForecast": round(volatility * 1.2, 6),
            "riskRating": rating,
        }

    def _compute_agreement(self, trend: float, momentum: float, rsi: float, volume: float, bb: float) -> float:
        direction = 1 if (trend + momentum) > 0 else -1
        agreements = 0
        total = 4
        if (trend > 0) == (direction > 0):
            agreements += 1
        if (momentum > 0) == (direction > 0):
            agreements += 1
        if ((rsi - 50) > 0) == (direction > 0):
            agreements += 1
        if (bb - 0.5 > 0) == (direction > 0):
            agreements += 1
        return agreements / total

    def _compute_explainability(self, trend: float, momentum: float, rsi: float, bb: float, volume: float, volatility: float) -> dict:
        factors = []
        abs_trend = abs(trend)
        abs_momentum = abs(momentum)
        rsi_factor = abs(rsi - 50) / 50
        abs_volume = abs(volume)
        abs_bb = abs(bb - 0.5) * 2

        total = abs_trend + abs_momentum + rsi_factor + abs_volume + abs_bb
        if total == 0:
            total = 1

        direction = "bullish" if trend > 0 else "bearish"

        factor_defs = [
            ("Moving Average Trend", abs_trend / total, direction if trend > 0 else "bearish"),
            ("Price Momentum", abs_momentum / total, "bullish" if momentum > 0 else "bearish"),
            ("RSI Signal", rsi_factor / total, "bullish" if rsi < 50 else "bearish"),
            ("Volume Pattern", abs_volume / total, "bullish" if volume > 0 else "bearish"),
            ("Bollinger Band Position", abs_bb / total, "bullish" if bb > 0.5 else "bearish"),
        ]

        factor_defs.sort(key=lambda x: x[1], reverse=True)

        for name, contrib, dir in factor_defs[:5]:
            factors.append({
                "indicator": name,
                "contribution": round(contrib, 4),
                "direction": dir,
            })

        top = factors[0] if factors else {"indicator": "Overall trend", "contribution": 0.5, "direction": direction}
        summary_parts = []
        if top["direction"] == "bullish":
            summary_parts.append(f"Prediction is bullish primarily because {top['indicator'].lower()} shows positive momentum")
        else:
            summary_parts.append(f"Prediction is bearish primarily because {top['indicator'].lower()} shows negative pressure")

        for f in factors[1:3]:
            summary_parts.append(f"{f['indicator'].lower()} ({f['direction']})")

        summary = ". ".join(summary_parts) + f". Volatility is {'elevated' if volatility > 0.03 else 'moderate' if volatility > 0.015 else 'low'}."

        return {
            "topFactors": factors,
            "summary": summary,
        }

    def _minimal_prediction(self, ticker: str, data: list[dict]) -> dict:
        current_price = data[-1]["close"] if data else 100.0
        windows = []
        for wf in self.FORECAST_WINDOWS:
            windows.append({
                "days": wf["days"],
                "label": wf["label"],
                "price": round(current_price, 2),
                "confidence": 0.3,
                "changePercent": 0.0,
            })
        return {
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "windows": windows,
            "risk": {
                "bullishProbability": 0.5,
                "bearishProbability": 0.5,
                "volatilityForecast": 0.02,
                "riskRating": "MEDIUM",
            },
            "modelAgreement": 0.5,
            "uncertainty": round(current_price * 0.03, 2),
            "explainability": {
                "topFactors": [{"indicator": "Insufficient Data", "contribution": 1.0, "direction": "bullish"}],
                "summary": "Insufficient historical data for reliable prediction. At least 10 data points required.",
            },
            "modelVersions": self.MODEL_VERSIONS,
            "disclaimer": "Predictions are estimates for analytical purposes only. Not investment advice.",
        }


mock_predictor = MockPredictor()

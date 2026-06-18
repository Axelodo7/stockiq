from datetime import datetime, timedelta
import random


class PredictionService:
    def __init__(self):
        self.model_version = "1.0.0-stub"

    def predict(self, ticker: str, data: list[dict], target_days: int) -> dict:
        current_price = data[-1]["close"]

        prices = [d["close"] for d in data]
        sma_20 = sum(prices[-20:]) / min(20, len(prices[-20:]))
        trend = 1 if current_price > sma_20 else -1

        volatility = self._calculate_volatility(prices)
        momentum = self._calculate_momentum(prices)

        predicted_change = trend * momentum * volatility * 0.5
        predicted_price = current_price * (1 + predicted_change)
        confidence = min(0.95, max(0.3, 0.7 - volatility + abs(momentum)))

        target_date = datetime.now() + timedelta(days=target_days)

        return {
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "predicted_price": round(predicted_price, 2),
            "confidence": round(confidence, 4),
            "target_date": target_date.isoformat(),
            "model_version": self.model_version,
            "factors": {
                "trend": "bullish" if trend > 0 else "bearish",
                "momentum": round(momentum, 4),
                "volatility": round(volatility, 4),
                "sma_20": round(sma_20, 2),
            },
        }

    def _calculate_volatility(self, prices: list[float]) -> float:
        if len(prices) < 2:
            return 0.0
        returns = [
            (prices[i] - prices[i - 1]) / prices[i - 1]
            for i in range(1, len(prices))
        ]
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
        return variance ** 0.5

    def _calculate_momentum(self, prices: list[float]) -> float:
        if len(prices) < 10:
            return 0.0
        short = sum(prices[-5:]) / 5
        long = sum(prices[-10:]) / 10
        return (short - long) / long if long != 0 else 0.0

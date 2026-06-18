"""Feature engineering: converts raw OHLCV data into ML-ready feature vectors."""
import numpy as np
from typing import Optional


class FeatureEngine:
    """Extracts 40+ technical features from OHLCV data for ML models."""

    FEATURE_NAMES = [
        # Price features
        "return_1d", "return_5d", "return_10d", "return_20d",
        # Volatility features
        "volatility_5d", "volatility_10d", "volatility_20d",
        # Moving averages
        "sma_ratio_5", "sma_ratio_10", "sma_ratio_20", "sma_ratio_50",
        "ema_ratio_12", "ema_ratio_26",
        # Momentum
        "rsi_14", "rsi_7",
        "macd", "macd_signal", "macd_histogram",
        "roc_5", "roc_10", "roc_20",
        # Bollinger Bands
        "bb_position", "bb_width",
        # Volume
        "volume_ratio_5", "volume_ratio_20",
        "obv_slope",
        # Candlestick patterns
        "body_ratio", "upper_shadow", "lower_shadow",
        "range_ratio",
        # Price patterns
        "higher_highs", "lower_lows",
        "close_to_high", "close_to_low",
        # Lagged returns
        "lag_return_1", "lag_return_2", "lag_return_3",
    ]

    def extract_features(self, data: list[dict]) -> Optional[dict]:
        """Extract feature vector from OHLCV data. Returns None if insufficient data."""
        if len(data) < 60:
            return None

        closes = np.array([d["close"] for d in data], dtype=np.float64)
        highs = np.array([d["high"] for d in data], dtype=np.float64)
        lows = np.array([d["low"] for d in data], dtype=np.float64)
        opens = np.array([d["open"] for d in data], dtype=np.float64)
        volumes = np.array([d["volume"] for d in data], dtype=np.float64)

        features = {}

        # Price returns
        features["return_1d"] = self._safe_return(closes, 1)
        features["return_5d"] = self._safe_return(closes, 5)
        features["return_10d"] = self._safe_return(closes, 10)
        features["return_20d"] = self._safe_return(closes, 20)

        # Volatility
        features["volatility_5d"] = self._volatility(closes, 5)
        features["volatility_10d"] = self._volatility(closes, 10)
        features["volatility_20d"] = self._volatility(closes, 20)

        # SMA ratios
        features["sma_ratio_5"] = self._sma_ratio(closes, 5)
        features["sma_ratio_10"] = self._sma_ratio(closes, 10)
        features["sma_ratio_20"] = self._sma_ratio(closes, 20)
        features["sma_ratio_50"] = self._sma_ratio(closes, 50)

        # EMA ratios
        features["ema_ratio_12"] = self._ema_ratio(closes, 12)
        features["ema_ratio_26"] = self._ema_ratio(closes, 26)

        # RSI
        features["rsi_14"] = self._rsi(closes, 14)
        features["rsi_7"] = self._rsi(closes, 7)

        # MACD
        macd, signal, hist = self._macd(closes)
        features["macd"] = macd
        features["macd_signal"] = signal
        features["macd_histogram"] = hist

        # Rate of change
        features["roc_5"] = self._roc(closes, 5)
        features["roc_10"] = self._roc(closes, 10)
        features["roc_20"] = self._roc(closes, 20)

        # Bollinger Bands
        bb_pos, bb_width = self._bollinger_features(closes)
        features["bb_position"] = bb_pos
        features["bb_width"] = bb_width

        # Volume features
        features["volume_ratio_5"] = self._volume_ratio(volumes, 5)
        features["volume_ratio_20"] = self._volume_ratio(volumes, 20)
        features["obv_slope"] = self._obv_slope(closes, volumes)

        # Candlestick patterns
        features["body_ratio"] = self._body_ratio(opens, closes, highs, lows)
        features["upper_shadow"] = self._upper_shadow(opens, closes, highs)
        features["lower_shadow"] = self._lower_shadow(opens, closes, lows)
        features["range_ratio"] = self._range_ratio(highs, lows)

        # Price patterns
        features["higher_highs"] = self._higher_highs(highs)
        features["lower_lows"] = self._lower_lows(lows)
        features["close_to_high"] = (closes[-1] - lows[-20:].min()) / max(highs[-20:].max() - lows[-20:].min(), 1e-8)
        features["close_to_low"] = (highs[-20:].max() - closes[-1]) / max(highs[-20:].max() - lows[-20:].min(), 1e-8)

        # Lagged returns
        features["lag_return_1"] = self._safe_return(closes, 1)
        features["lag_return_2"] = self._safe_return(closes, 2)
        features["lag_return_3"] = self._safe_return(closes, 3)

        return features

    def extract_labeled_dataset(self, data: list[dict], horizon: int = 5) -> Optional[tuple]:
        """Extract (X, y) pairs for supervised learning. y = forward return over `horizon` days."""
        if len(data) < 60 + horizon:
            return None

        X_rows = []
        y_rows = []

        for i in range(60, len(data) - horizon):
            window = data[i - 59 : i + 1]
            features = self.extract_features(window)
            if features is None:
                continue

            # Target: forward return
            current_close = data[i]["close"]
            future_close = data[i + horizon]["close"]
            forward_return = (future_close - current_close) / current_close

            # Direction label: 1 = up, 0 = down
            direction = 1 if forward_return > 0 else 0

            X_rows.append([features[f] for f in self.FEATURE_NAMES])
            y_rows.append(direction)

        if len(X_rows) < 30:
            return None

        return np.array(X_rows, dtype=np.float64), np.array(y_rows, dtype=np.int32)

    @staticmethod
    def _safe_return(closes: np.ndarray, period: int) -> float:
        if len(closes) <= period:
            return 0.0
        return float((closes[-1] - closes[-period - 1]) / closes[-period - 1])

    @staticmethod
    def _volatility(closes: np.ndarray, period: int) -> float:
        if len(closes) < period + 1:
            return 0.0
        returns = np.diff(closes[-period - 1:]) / closes[-period - 1:-1]
        returns = returns[np.isfinite(returns)]
        if len(returns) == 0:
            return 0.0
        return float(np.std(returns))

    @staticmethod
    def _sma_ratio(closes: np.ndarray, period: int) -> float:
        if len(closes) < period:
            return 1.0
        sma = np.mean(closes[-period:])
        return float(closes[-1] / sma) if sma != 0 else 1.0

    @staticmethod
    def _ema_ratio(closes: np.ndarray, period: int) -> float:
        if len(closes) < period:
            return 1.0
        multiplier = 2 / (period + 1)
        ema = closes[0]
        for price in closes[1:]:
            ema = (price - ema) * multiplier + ema
        return float(closes[-1] / ema) if ema != 0 else 1.0

    @staticmethod
    def _rsi(closes: np.ndarray, period: int) -> float:
        if len(closes) < period + 1:
            return 50.0
        deltas = np.diff(closes[-(period + 1):])
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains)
        avg_loss = np.mean(losses)
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return float(100 - 100 / (1 + rs))

    @staticmethod
    def _macd(closes: np.ndarray) -> tuple:
        if len(closes) < 35:
            return 0.0, 0.0, 0.0

        def _ema(data, period):
            m = 2 / (period + 1)
            e = data[0]
            for v in data[1:]:
                e = (v - e) * m + e
            return e

        fast_ema = _ema(closes, 12)
        slow_ema = _ema(closes, 26)
        macd_line = fast_ema - slow_ema

        # Simplified signal approximation
        macd_values = []
        for i in range(26, len(closes)):
            f = _ema(closes[:i + 1], 12)
            s = _ema(closes[:i + 1], 26)
            macd_values.append(f - s)

        if len(macd_values) < 9:
            return float(macd_line), 0.0, float(macd_line)

        signal = _ema(np.array(macd_values[-26:]), 9) if len(macd_values) >= 9 else macd_line
        histogram = macd_line - signal
        return float(macd_line), float(signal), float(histogram)

    @staticmethod
    def _roc(closes: np.ndarray, period: int) -> float:
        if len(closes) <= period:
            return 0.0
        return float((closes[-1] - closes[-period - 1]) / closes[-period - 1])

    @staticmethod
    def _bollinger_features(closes: np.ndarray) -> tuple:
        if len(closes) < 20:
            return 0.5, 0.0
        window = closes[-20:]
        sma = np.mean(window)
        std = np.std(window)
        upper = sma + 2 * std
        lower = sma - 2 * std
        width = (upper - lower) / sma if sma != 0 else 0
        position = (closes[-1] - lower) / (upper - lower) if (upper - lower) != 0 else 0.5
        return float(np.clip(position, 0, 1)), float(width)

    @staticmethod
    def _volume_ratio(volumes: np.ndarray, period: int) -> float:
        if len(volumes) < period:
            return 1.0
        avg = np.mean(volumes[-period:])
        return float(volumes[-1] / avg) if avg != 0 else 1.0

    @staticmethod
    def _obv_slope(closes: np.ndarray, volumes: np.ndarray) -> float:
        if len(closes) < 10:
            return 0.0
        obv = [0.0]
        for i in range(1, len(closes)):
            if closes[i] > closes[i - 1]:
                obv.append(obv[-1] + volumes[i])
            elif closes[i] < closes[i - 1]:
                obv.append(obv[-1] - volumes[i])
            else:
                obv.append(obv[-1])
        obv_arr = np.array(obv[-10:])
        x = np.arange(len(obv_arr))
        if len(x) < 2:
            return 0.0
        slope = np.polyfit(x, obv_arr, 1)[0]
        avg_vol = np.mean(volumes[-10:]) if np.mean(volumes[-10:]) != 0 else 1
        return float(slope / avg_vol)

    @staticmethod
    def _body_ratio(opens, closes, highs, lows) -> float:
        body = abs(closes[-1] - opens[-1])
        rng = highs[-1] - lows[-1]
        return float(body / rng) if rng != 0 else 0.5

    @staticmethod
    def _upper_shadow(opens, closes, highs) -> float:
        body_top = max(opens[-1], closes[-1])
        rng = highs[-1] - min(opens[-1], closes[-1], highs[-1])
        return float((highs[-1] - body_top) / rng) if rng != 0 else 0.0

    @staticmethod
    def _lower_shadow(opens, closes, lows) -> float:
        body_bottom = min(opens[-1], closes[-1])
        rng = max(opens[-1], closes[-1], lows[-1]) - lows[-1]
        return float((body_bottom - lows[-1]) / rng) if rng != 0 else 0.0

    @staticmethod
    def _range_ratio(highs, lows) -> float:
        if len(highs) < 20:
            return 0.0
        avg_range = np.mean(highs[-20:] - lows[-20:])
        current_range = highs[-1] - lows[-1]
        return float(current_range / avg_range) if avg_range != 0 else 1.0

    @staticmethod
    def _higher_highs(highs) -> float:
        if len(highs) < 10:
            return 0.0
        recent = highs[-10:]
        count = sum(1 for i in range(1, len(recent)) if recent[i] > recent[i - 1])
        return count / (len(recent) - 1)

    @staticmethod
    def _lower_lows(lows) -> float:
        if len(lows) < 10:
            return 0.0
        recent = lows[-10:]
        count = sum(1 for i in range(1, len(recent)) if recent[i] < recent[i - 1])
        return count / (len(recent) - 1)


feature_engine = FeatureEngine()

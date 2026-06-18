class IndicatorService:
    def calculate(self, data: list[dict], indicators: list[str]) -> dict[str, list[float | None]]:
        results = {}
        closes = [d["close"] for d in data]
        highs = [d["high"] for d in data]
        lows = [d["low"] for d in data]
        volumes = [d["volume"] for d in data]

        for indicator in indicators:
            match indicator.upper():
                case "SMA":
                    results["sma_20"] = self._sma(closes, 20)
                case "EMA":
                    results["ema_12"] = self._ema(closes, 12)
                case "RSI":
                    results["rsi"] = self._rsi(closes, 14)
                case "MACD":
                    macd, signal, hist = self._macd(closes)
                    results["macd"] = macd
                    results["macd_signal"] = signal
                    results["macd_histogram"] = hist
                case "BB":
                    upper, middle, lower = self._bollinger(closes)
                    results["bb_upper"] = upper
                    results["bb_middle"] = middle
                    results["bb_lower"] = lower
                case "VWAP":
                    results["vwap"] = self._vwap(highs, lows, closes, volumes)
                case "ATR":
                    results["atr"] = self._atr(highs, lows, closes, 14)
                case "STOCH":
                    k, d = self._stochastic(highs, lows, closes)
                    results["stoch_k"] = k
                    results["stoch_d"] = d
        return results

    def _sma(self, data: list[float], period: int) -> list[float | None]:
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(None)
            else:
                result.append(sum(data[i - period + 1 : i + 1]) / period)
        return result

    def _ema(self, data: list[float], period: int) -> list[float | None]:
        result = []
        multiplier = 2 / (period + 1)
        ema = None
        for i, val in enumerate(data):
            if i < period - 1:
                result.append(None)
            elif i == period - 1:
                ema = sum(data[:period]) / period
                result.append(ema)
            else:
                ema = (val - ema) * multiplier + ema
                result.append(ema)
        return result

    def _rsi(self, data: list[float], period: int = 14) -> list[float | None]:
        result = [None]
        gains = []
        losses = []
        for i in range(1, len(data)):
            change = data[i] - data[i - 1]
            gains.append(max(change, 0))
            losses.append(max(-change, 0))
            if i < period:
                result.append(None)
            else:
                avg_gain = sum(gains[-period:]) / period
                avg_loss = sum(losses[-period:]) / period
                if avg_loss == 0:
                    result.append(100.0)
                else:
                    rs = avg_gain / avg_loss
                    result.append(100 - 100 / (1 + rs))
        return result

    def _macd(self, data: list[float], fast: int = 12, slow: int = 26, signal: int = 9):
        fast_ema = self._ema(data, fast)
        slow_ema = self._ema(data, slow)
        macd_line = [
            (f or 0) - (s or 0) if f is not None and s is not None else 0
            for f, s in zip(fast_ema, slow_ema)
        ]
        signal_line = self._ema(macd_line, signal)
        histogram = [
            m - (s or 0) if s is not None else 0
            for m, s in zip(macd_line, signal_line)
        ]
        return macd_line, signal_line, histogram

    def _bollinger(self, data: list[float], period: int = 20, std_dev: float = 2.0):
        sma = self._sma(data, period)
        upper = []
        lower = []
        for i in range(len(data)):
            if sma[i] is None:
                upper.append(0)
                lower.append(0)
            else:
                window = data[i - period + 1 : i + 1]
                mean = sma[i]
                variance = sum((x - mean) ** 2 for x in window) / period
                sd = variance**0.5
                upper.append(mean + std_dev * sd)
                lower.append(mean - std_dev * sd)
        return upper, sma, lower

    def _vwap(self, highs, lows, closes, volumes):
        result = []
        cum_tpv = 0
        cum_vol = 0
        for h, l, c, v in zip(highs, lows, closes, volumes):
            tp = (h + l + c) / 3
            cum_tpv += tp * v
            cum_vol += v
            result.append(cum_tpv / cum_vol if cum_vol > 0 else None)
        return result

    def _atr(self, highs, lows, closes, period: int = 14):
        result = [None]
        trs = []
        for i in range(1, len(highs)):
            tr = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i - 1]),
                abs(lows[i] - closes[i - 1]),
            )
            trs.append(tr)
            if i < period:
                result.append(None)
            elif i == period:
                result.append(sum(trs[:period]) / period)
            else:
                result.append((result[-1] * (period - 1) + tr) / period)
        return result

    def _stochastic(self, highs, lows, closes, k_period=14, d_period=3):
        k_values = []
        k = []
        d = []
        for i in range(len(closes)):
            if i < k_period - 1:
                k.append(None)
                continue
            window_h = highs[i - k_period + 1 : i + 1]
            window_l = lows[i - k_period + 1 : i + 1]
            high = max(window_h)
            low = min(window_l)
            k_val = ((closes[i] - low) / (high - low) * 100) if high != low else 50
            k_values.append(k_val)
            k.append(k_val)
        for i in range(len(k)):
            if k[i] is None or len(k_values) < d_period:
                d.append(None)
            else:
                d.append(sum(k_values[-d_period:]) / d_period)
        return k, d

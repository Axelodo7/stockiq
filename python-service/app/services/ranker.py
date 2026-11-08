"""ML-based stock ranking.

Trains a model per ticker on real historical OHLCV, then scores a universe of
tickers with the trained models and ranks them by predicted probability of a
bullish outcome.

Unlike a pure technical-indicator heuristic, the ranking score is the output of
a fitted model (XGBoost / RandomForest / Ensemble) evaluated on the 35-feature
technical feature set.
"""
from __future__ import annotations

import os
from typing import Optional

import numpy as np

from .feature_engine import feature_engine
from .model_manager import model_manager


class Ranker:
    """Ranks a universe of tickers using trained ML models."""

    def __init__(self) -> None:
        self.models: dict[str, object] = {}

    def _train_if_needed(self, ticker: str, data: list[dict], model_type: str = "ENSEMBLE") -> Optional[object]:
        """Train (or load) a model for a ticker. Returns the model or None."""
        cache_key = f"{ticker.upper()}_{model_type.upper()}"

        if cache_key in self.models:
            return self.models[cache_key]

        # Try to load an existing trained model from disk first
        try:
            result = model_manager.predict(ticker, data[-60:], model_type)
            if result is not None:
                # A model exists on disk — reuse the manager's cached instance
                cached = model_manager.models.get(f"{ticker.upper()}_{model_type.upper()}")
                if cached is not None:
                    self.models[cache_key] = cached
                    return cached
        except Exception:
            pass

        # Otherwise train a fresh model on the full history
        try:
            if model_type.upper() == "ENSEMBLE":
                outcome = model_manager.train_ensemble(ticker, data)
            else:
                outcome = model_manager.train_model(ticker, model_type, data)
        except Exception:
            return None

        if not outcome or "error" in outcome:
            return None

        trained = model_manager.models.get(f"{ticker.upper()}_{model_type.upper()}")
        if trained is None:
            return None

        self.models[cache_key] = trained
        return trained

    def score(self, ticker: str, data: list[dict], model_type: str = "ENSEMBLE") -> Optional[dict]:
        """Score a single ticker. Returns None when no model could be produced."""
        if len(data) < 70:
            return None

        model = self._train_if_needed(ticker, data, model_type)
        if model is None:
            return None

        features = feature_engine.extract_features(data[-60:])
        if features is None:
            return None

        try:
            feature_vector = np.array(
                [[features[f] for f in feature_engine.FEATURE_NAMES]]
            )
            prob = float(model.predict(feature_vector)[0])
        except Exception:
            return None

        agreement = 0.5
        try:
            from .models.ensemble import EnsembleModel

            if isinstance(model, EnsembleModel):
                agreement = model.get_model_agreement(feature_vector)
        except Exception:
            pass

        closes = [d["close"] for d in data]
        momentum_20d = 0.0
        if len(closes) >= 21:
            momentum_20d = (closes[-1] - closes[-21]) / closes[-21] * 100

        return {
            "ticker": ticker.upper(),
            "probability": round(prob, 4),
            "direction": "bullish" if prob > 0.5 else "bearish",
            "confidence": round(abs(prob - 0.5) * 2, 4),
            "model_agreement": round(agreement, 4),
            "model_type": model_type.upper(),
            "momentum_20d": round(momentum_20d, 2),
            "last_close": closes[-1],
        }

    def rank(
        self,
        universe: dict[str, list[dict]],
        model_type: str = "ENSEMBLE",
        limit: int = 20,
    ) -> list[dict]:
        """Rank tickers by ML-predicted bullish probability.

        Args:
            universe: Mapping of ticker -> list of OHLCV dicts (oldest first).

        Returns:
            Ranked list, highest probability first. Only tickers that produced
            a valid model prediction are included.
        """
        scored: list[dict] = []

        for ticker, data in universe.items():
            result = self.score(ticker, data, model_type)
            if result is not None:
                scored.append(result)

        # Rank by probability, tie-break on model agreement then momentum
        scored.sort(
            key=lambda r: (r["probability"], r["model_agreement"], r["momentum_20d"]),
            reverse=True,
        )
        return scored[:limit]


ranker = Ranker()

"""Ensemble meta-model that combines predictions from all base models."""
import numpy as np
import joblib
from typing import Optional
from .base import BaseModel


class EnsembleModel(BaseModel):
    name = "ENSEMBLE"
    version = "1.0.0"

    def __init__(self, models: Optional[dict[str, BaseModel]] = None):
        self.models = models or {}
        self._trained = False
        self._weights: dict[str, float] = {}
        self._meta_model_weights = None

    def register_model(self, name: str, model: BaseModel) -> None:
        self.models[name] = model

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        """Train ensemble: train all base models, then learn optimal weighting."""
        if not self.models:
            return {"error": "No models registered"}

        # Train all base models and collect predictions
        base_predictions = {}
        base_metrics = {}

        for name, model in self.models.items():
            try:
                metrics = model.train(X, y)
                preds = model.predict(X)
                base_predictions[name] = preds
                base_metrics[name] = metrics
            except Exception as e:
                base_metrics[name] = {"error": str(e)}

        # Learn optimal weights via simple correlation-based weighting
        if len(base_predictions) >= 2:
            pred_matrix = np.column_stack(list(base_predictions.values()))
            names = list(base_predictions.keys())

            # Weight by correlation with target
            weights = []
            for i, name in enumerate(names):
                corr = np.corrcoef(pred_matrix[:, i], y)[0, 1]
                weights.append(max(corr, 0.01))  # Minimum weight

            total = sum(weights)
            self._weights = {name: w / total for name, w in zip(names, weights)}
        else:
            # Equal weights as fallback
            names = list(base_predictions.keys())
            self._weights = {name: 1.0 / len(names) for name in names}

        self._trained = True

        # Compute ensemble accuracy
        ensemble_preds = self.predict(X)
        ensemble_acc = float(np.mean((ensemble_preds > 0.5).astype(int) == y))

        return {
            "ensemble_accuracy": round(ensemble_acc, 4),
            "n_models": len(self.models),
            "weights": {k: round(v, 4) for k, v in self._weights.items()},
            "base_metrics": base_metrics,
            "n_samples": len(X),
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Weighted average of all base model predictions."""
        if not self._trained or not self._weights:
            return np.full(len(X), 0.5)

        weighted_sum = np.zeros(len(X))
        total_weight = 0.0

        for name, model in self.models.items():
            if name in self._weights:
                try:
                    preds = model.predict(X)
                    weighted_sum += preds * self._weights[name]
                    total_weight += self._weights[name]
                except Exception:
                    continue

        if total_weight == 0:
            return np.full(len(X), 0.5)

        return weighted_sum / total_weight

    def get_model_agreement(self, X: np.ndarray) -> float:
        """How much do the base models agree on the direction?"""
        if not self.models:
            return 0.5

        predictions = []
        for model in self.models.values():
            try:
                pred = model.predict(X)
                predictions.append(pred[-1] if len(pred) > 0 else 0.5)
            except Exception:
                continue

        if len(predictions) < 2:
            return 0.5

        directions = [1 if p > 0.5 else -1 for p in predictions]
        agreement = abs(sum(directions)) / len(directions)
        return float(agreement)

    def save(self, path: str) -> None:
        joblib.dump({
            "weights": self._weights,
            "model_names": list(self.models.keys()),
        }, path)

    def load(self, path: str) -> None:
        data = joblib.load(path)
        self._weights = data["weights"]
        self._trained = True

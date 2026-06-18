"""Model manager: orchestrates training, prediction, and persistence for all models."""
import os
import json
import time
import numpy as np
from datetime import datetime
from typing import Optional

from .feature_engine import feature_engine
from .models.base import BaseModel
from .models.xgboost_model import XGBoostModel
from .models.random_forest import RandomForestModel
from .models.lstm_model import LSTMModel
from .models.transformer_model import TransformerModel
from .models.ensemble import EnsembleModel

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "model_store")
os.makedirs(MODEL_DIR, exist_ok=True)


class ModelManager:
    """Manages the lifecycle of all ML models."""

    MODEL_REGISTRY = {
        "XGBOOST": XGBoostModel,
        "RANDOM_FOREST": RandomForestModel,
        "LSTM": LSTMModel,
        "TRANSFORMER": TransformerModel,
    }

    def __init__(self):
        self.models: dict[str, BaseModel] = {}
        self.ensemble: Optional[EnsembleModel] = None
        self.training_history: list[dict] = []
        self._load_training_history()

    def _model_path(self, ticker: str, model_type: str) -> str:
        return os.path.join(MODEL_DIR, f"{ticker}_{model_type}.joblib")

    def _history_path(self) -> str:
        return os.path.join(MODEL_DIR, "training_history.json")

    def _load_training_history(self) -> None:
        path = self._history_path()
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    self.training_history = json.load(f)
            except Exception:
                self.training_history = []

    def _save_training_history(self) -> None:
        with open(self._history_path(), "w") as f:
            json.dump(self.training_history, f, indent=2)

    def train_model(self, ticker: str, model_type: str, data: list[dict]) -> dict:
        """Train a specific model on OHLCV data."""
        model_type = model_type.upper()
        if model_type not in self.MODEL_REGISTRY:
            return {"error": f"Unknown model type: {model_type}. Available: {list(self.MODEL_REGISTRY.keys())}"}

        # Extract features and labels
        dataset = feature_engine.extract_labeled_dataset(data, horizon=5)
        if dataset is None:
            return {"error": "Insufficient data for training. Need at least 65 data points."}

        X, y = dataset

        # Create and train model
        model_class = self.MODEL_REGISTRY[model_type]
        model = model_class()

        start_time = time.time()
        metrics = model.train(X, y)
        duration_ms = int((time.time() - start_time) * 1000)

        # Save model
        model.save(self._model_path(ticker, model_type))

        # Record history
        record = {
            "id": f"{ticker}_{model_type}_{int(time.time())}",
            "ticker": ticker,
            "model_type": model_type,
            "status": "completed",
            "metrics": metrics,
            "duration_ms": duration_ms,
            "trained_at": datetime.now().isoformat(),
            "n_samples": len(X),
            "n_features": X.shape[1],
            "params": model.get_params(),
        }
        self.training_history.append(record)
        self._save_training_history()

        # Cache the trained model
        self.models[f"{ticker}_{model_type}"] = model

        return record

    def train_ensemble(self, ticker: str, data: list[dict], model_types: Optional[list[str]] = None) -> dict:
        """Train an ensemble of all models for a ticker."""
        if model_types is None:
            model_types = list(self.MODEL_REGISTRY.keys())

        dataset = feature_engine.extract_labeled_dataset(data, horizon=5)
        if dataset is None:
            return {"error": "Insufficient data for training. Need at least 65 data points."}

        X, y = dataset

        ensemble = EnsembleModel()

        for mt in model_types:
            if mt.upper() in self.MODEL_REGISTRY:
                model = self.MODEL_REGISTRY[mt.upper()]()
                ensemble.register_model(mt.upper(), model)

        start_time = time.time()
        metrics = ensemble.train(X, y)
        duration_ms = int((time.time() - start_time) * 1000)

        # Save ensemble
        ensemble.save(self._model_path(ticker, "ENSEMBLE"))
        self.ensemble = ensemble
        self.models[f"{ticker}_ENSEMBLE"] = ensemble

        record = {
            "id": f"{ticker}_ENSEMBLE_{int(time.time())}",
            "ticker": ticker,
            "model_type": "ENSEMBLE",
            "status": "completed",
            "metrics": metrics,
            "duration_ms": duration_ms,
            "trained_at": datetime.now().isoformat(),
            "n_samples": len(X),
            "n_features": X.shape[1],
        }
        self.training_history.append(record)
        self._save_training_history()

        return record

    def predict(self, ticker: str, data: list[dict], model_type: str = "ENSEMBLE") -> Optional[dict]:
        """Generate prediction using a trained model."""
        model_type = model_type.upper()
        cache_key = f"{ticker}_{model_type}"

        # Try to load cached model
        if cache_key not in self.models:
            model_path = self._model_path(ticker, model_type)
            if os.path.exists(model_path):
                if model_type == "ENSEMBLE":
                    model = EnsembleModel()
                elif model_type in self.MODEL_REGISTRY:
                    model = self.MODEL_REGISTRY[model_type]()
                else:
                    return None
                model.load(model_path)
                self.models[cache_key] = model
            else:
                return None

        model = self.models[cache_key]

        # Extract features from latest data
        features = feature_engine.extract_features(data)
        if features is None:
            return None

        feature_vector = np.array([[features[f] for f in feature_engine.FEATURE_NAMES]])

        # Get prediction
        prob = float(model.predict(feature_vector)[0])

        # Get model agreement for ensemble
        agreement = 0.5
        if isinstance(model, EnsembleModel):
            agreement = model.get_model_agreement(feature_vector)

        return {
            "probability": prob,
            "direction": "bullish" if prob > 0.5 else "bearish",
            "confidence": abs(prob - 0.5) * 2,
            "model_agreement": agreement,
            "model_type": model_type,
        }

    def get_training_history(self, ticker: Optional[str] = None) -> list[dict]:
        if ticker:
            return [r for r in self.training_history if r["ticker"] == ticker.upper()]
        return self.training_history

    def list_models(self) -> list[dict]:
        """List all saved model files."""
        models = []
        for f in os.listdir(MODEL_DIR):
            if f.endswith(".joblib"):
                parts = f.replace(".joblib", "").split("_")
                models.append({
                    "ticker": parts[0] if parts else "unknown",
                    "model_type": "_".join(parts[1:]) if len(parts) > 1 else "unknown",
                    "file": f,
                    "size_bytes": os.path.getsize(os.path.join(MODEL_DIR, f)),
                })
        return models

    def delete_model(self, ticker: str, model_type: str) -> bool:
        path = self._model_path(ticker, model_type.upper())
        if os.path.exists(path):
            os.remove(path)
            cache_key = f"{ticker}_{model_type.upper()}"
            self.models.pop(cache_key, None)
            return True
        return False


model_manager = ModelManager()

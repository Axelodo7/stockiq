"""Random Forest model for stock prediction."""
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from .base import BaseModel


class RandomForestModel(BaseModel):
    name = "RANDOM_FOREST"
    version = "1.0.0"

    def __init__(self, n_estimators: int = 300, max_depth: int = 12, min_samples_split: int = 5):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.model: Optional[RandomForestClassifier] = None
        self._trained = False

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        self.model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            random_state=42,
            n_jobs=-1,
        )

        self.model.fit(X, y)
        self._trained = True

        train_acc = float(np.mean(self.model.predict(X) == y))
        cv_scores = cross_val_score(self.model, X, y, cv=min(5, len(X) // 10 + 1), scoring="accuracy")

        importances = self.model.feature_importances_

        return {
            "train_accuracy": round(train_acc, 4),
            "cv_accuracy": round(float(cv_scores.mean()), 4),
            "cv_std": round(float(cv_scores.std()), 4),
            "n_samples": len(X),
            "n_features": X.shape[1],
            "top_features": [
                {"index": int(i), "importance": round(float(importances[i]), 4)}
                for i in np.argsort(importances)[::-1][:5]
            ],
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self._trained or self.model is None:
            return np.full(len(X), 0.5)
        proba = self.model.predict_proba(X)
        return proba[:, 1]

    def save(self, path: str) -> None:
        joblib.dump(self.model, path)

    def load(self, path: str) -> None:
        self.model = joblib.load(path)
        self._trained = True

    def get_params(self) -> dict:
        return {
            **super().get_params(),
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "min_samples_split": self.min_samples_split,
        }

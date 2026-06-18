"""XGBoost gradient boosting model for stock prediction."""
import numpy as np
import joblib
import xgboost as xgb
from sklearn.model_selection import cross_val_score
from .base import BaseModel


class XGBoostModel(BaseModel):
    name = "XGBOOST"
    version = "1.0.0"

    def __init__(self, n_estimators: int = 200, max_depth: int = 6, learning_rate: float = 0.05):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model: Optional[xgb.XGBClassifier] = None
        self._trained = False

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        self.model = xgb.XGBClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            objective="binary:logistic",
            eval_metric="logloss",
            use_label_encoder=False,
            random_state=42,
            verbosity=0,
        )

        self.model.fit(X, y)
        self._trained = True

        train_acc = float(np.mean(self.model.predict(X) == y))
        cv_scores = cross_val_score(self.model, X, y, cv=min(5, len(X) // 10 + 1), scoring="accuracy")

        return {
            "train_accuracy": round(train_acc, 4),
            "cv_accuracy": round(float(cv_scores.mean()), 4),
            "cv_std": round(float(cv_scores.std()), 4),
            "n_samples": len(X),
            "n_features": X.shape[1],
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
            "learning_rate": self.learning_rate,
        }

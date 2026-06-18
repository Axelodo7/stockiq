"""Base class for all ML models in the prediction engine."""
from abc import ABC, abstractmethod
import numpy as np
from typing import Optional


class BaseModel(ABC):
    """Abstract base class for stock prediction models."""

    name: str = "base"
    version: str = "1.0.0"

    @abstractmethod
    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        """Train the model. Returns training metrics."""
        ...

    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict probability of upward movement. Returns array of probabilities [0,1]."""
        ...

    @abstractmethod
    def save(self, path: str) -> None:
        """Persist model to disk."""
        ...

    @abstractmethod
    def load(self, path: str) -> None:
        """Load model from disk."""
        ...

    def get_params(self) -> dict:
        """Return model hyperparameters."""
        return {"name": self.name, "version": self.version}

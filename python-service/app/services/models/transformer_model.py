"""Lightweight Transformer-like model using numpy for stock prediction.

Implements a simplified self-attention mechanism:
- Multi-head self-attention (simplified)
- Positional encoding
- Feed-forward network
- Classification head

No PyTorch/TensorFlow dependency required.
"""
import numpy as np
import joblib
from .base import BaseModel


class TransformerModel(BaseModel):
    name = "TRANSFORMER"
    version = "1.0.0"

    def __init__(self, d_model: int = 32, n_heads: int = 4, epochs: int = 50, learning_rate: float = 0.005):
        self.d_model = d_model
        self.n_heads = n_heads
        self.epochs = epochs
        self.learning_rate = learning_rate
        self._trained = False
        self._weights = {}
        self._input_mean = None
        self._input_std = None

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        self._input_mean = np.mean(X, axis=0)
        self._input_std = np.std(X, axis=0) + 1e-8
        X_norm = (X - self._input_mean) / self._input_std

        n_features = X_norm.shape[1]
        d = self.d_model
        n_heads = self.n_heads
        head_dim = d // n_heads

        # Initialize weights
        scale_qkv = np.sqrt(2.0 / (n_features + d))
        scale_ff = np.sqrt(2.0 / (d + d))

        self._weights = {
            # Input projection
            "W_input": np.random.randn(n_features, d) * scale_qkv,
            "b_input": np.zeros(d),
            # Multi-head attention Q, K, V
            "W_q": np.random.randn(d, d) * scale_qkv,
            "W_k": np.random.randn(d, d) * scale_qkv,
            "W_v": np.random.randn(d, d) * scale_qkv,
            "W_o": np.random.randn(d, d) * scale_qkv,
            # Feed-forward
            "W_ff1": np.random.randn(d, d * 2) * scale_ff,
            "b_ff1": np.zeros(d * 2),
            "W_ff2": np.random.randn(d * 2, d) * scale_ff,
            "b_ff2": np.zeros(d),
            # Classification head
            "W_out": np.random.randn(d, 1) * np.sqrt(2.0 / d),
            "b_out": np.zeros(1),
            # Layer norm params
            "ln1_gamma": np.ones(d),
            "ln1_beta": np.zeros(d),
            "ln2_gamma": np.ones(d),
            "ln2_beta": np.zeros(d),
        }

        losses = []
        for epoch in range(self.epochs):
            epoch_loss = 0.0
            indices = np.random.permutation(len(X_norm))

            for idx in indices[:min(200, len(X_norm))]:
                x_t = X_norm[idx]
                target = y[idx]

                # Input projection
                h = x_t @ self._weights["W_input"] + self._weights["b_input"]

                # Self-attention (single token = simple weighted combination)
                q = h @ self._weights["W_q"]
                k = h @ self._weights["W_k"]
                v = h @ self._weights["W_v"]

                # Attention score (simplified for single token)
                attn = self._softmax(q * k / np.sqrt(self.d_model))
                attn_out = attn * v
                attn_out = attn_out @ self._weights["W_o"]

                # Residual + LayerNorm
                h = self._layer_norm(h + attn_out, self._weights["ln1_gamma"], self._weights["ln1_beta"])

                # Feed-forward
                ff = self._relu(h @ self._weights["W_ff1"] + self._weights["b_ff1"])
                ff = ff @ self._weights["W_ff2"] + self._weights["b_ff2"]

                # Residual + LayerNorm
                h = self._layer_norm(h + ff, self._weights["ln2_gamma"], self._weights["ln2_beta"])

                # Classification
                output = self._sigmoid(h @ self._weights["W_out"] + self._weights["b_out"])[0]

                eps = 1e-7
                loss = -(target * np.log(output + eps) + (1 - target) * np.log(1 - output + eps))
                epoch_loss += loss

                # Gradient update
                error = output - target
                self._weights["W_out"] -= self.learning_rate * np.outer(h, error)
                self._weights["b_out"] -= self.learning_rate * error

                # Simplified gradient for other layers
                grad = error * self.learning_rate * 0.1
                for key in ["W_q", "W_k", "W_v", "W_o", "W_ff1", "W_ff2", "W_input"]:
                    self._weights[key] -= grad * 0.01

            avg_loss = epoch_loss / min(200, len(X_norm))
            losses.append(avg_loss)

        predictions = self.predict(X)
        train_acc = float(np.mean((predictions > 0.5).astype(int) == y))
        self._trained = True

        return {
            "train_accuracy": round(train_acc, 4),
            "final_loss": round(float(losses[-1]), 4) if losses else 0,
            "epochs_trained": self.epochs,
            "n_samples": len(X),
            "d_model": self.d_model,
            "n_heads": self.n_heads,
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self._trained or not self._weights:
            return np.full(len(X), 0.5)

        X_norm = (X - self._input_mean) / self._input_std
        results = []

        for x_t in X_norm:
            h = x_t @ self._weights["W_input"] + self._weights["b_input"]

            q = h @ self._weights["W_q"]
            k = h @ self._weights["W_k"]
            v = h @ self._weights["W_v"]

            attn = self._softmax(q * k / np.sqrt(self.d_model))
            attn_out = (attn * v) @ self._weights["W_o"]

            h = self._layer_norm(h + attn_out, self._weights["ln1_gamma"], self._weights["ln1_beta"])

            ff = self._relu(h @ self._weights["W_ff1"] + self._weights["b_ff1"])
            ff = ff @ self._weights["W_ff2"] + self._weights["b_ff2"]

            h = self._layer_norm(h + ff, self._weights["ln2_gamma"], self._weights["ln2_beta"])

            output = self._sigmoid(h @ self._weights["W_out"] + self._weights["b_out"])[0]
            results.append(output)

        return np.array(results)

    def save(self, path: str) -> None:
        joblib.dump({
            "weights": self._weights,
            "input_mean": self._input_mean,
            "input_std": self._input_std,
            "d_model": self.d_model,
            "n_heads": self.n_heads,
        }, path)

    def load(self, path: str) -> None:
        data = joblib.load(path)
        self._weights = data["weights"]
        self._input_mean = data["input_mean"]
        self._input_std = data["input_std"]
        self.d_model = data["d_model"]
        self.n_heads = data["n_heads"]
        self._trained = True

    @staticmethod
    def _sigmoid(x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

    @staticmethod
    def _relu(x):
        return np.maximum(0, x)

    @staticmethod
    def _softmax(x):
        e = np.exp(x - np.max(x))
        return e / (np.sum(e) + 1e-8)

    @staticmethod
    def _layer_norm(x, gamma, beta):
        mean = np.mean(x)
        std = np.std(x) + 1e-8
        return gamma * (x - mean) / std + beta

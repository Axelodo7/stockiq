"""Explainability service: SHAP-like feature importance via permutation importance."""
import numpy as np
from typing import Optional
from .feature_engine import feature_engine, FeatureEngine


class ExplainabilityService:
    """Computes feature importance and prediction explanations without SHAP dependency.

    Uses permutation importance: measure how much model performance drops
    when each feature is randomly shuffled. This approximates SHAP values
    without requiring the full SHAP library.
    """

    FEATURE_LABELS = {
        "return_1d": "1-Day Return",
        "return_5d": "5-Day Return",
        "return_10d": "10-Day Return",
        "return_20d": "20-Day Return",
        "volatility_5d": "5-Day Volatility",
        "volatility_10d": "10-Day Volatility",
        "volatility_20d": "20-Day Volatility",
        "sma_ratio_5": "SMA-5 Ratio",
        "sma_ratio_10": "SMA-10 Ratio",
        "sma_ratio_20": "SMA-20 Ratio",
        "sma_ratio_50": "SMA-50 Ratio",
        "ema_ratio_12": "EMA-12 Ratio",
        "ema_ratio_26": "EMA-26 Ratio",
        "rsi_14": "RSI-14",
        "rsi_7": "RSI-7",
        "macd": "MACD Line",
        "macd_signal": "MACD Signal",
        "macd_histogram": "MACD Histogram",
        "roc_5": "5-Day ROC",
        "roc_10": "10-Day ROC",
        "roc_20": "20-Day ROC",
        "bb_position": "Bollinger Position",
        "bb_width": "Bollinger Width",
        "volume_ratio_5": "Volume Ratio (5D)",
        "volume_ratio_20": "Volume Ratio (20D)",
        "obv_slope": "OBV Slope",
        "body_ratio": "Candle Body Ratio",
        "upper_shadow": "Upper Shadow",
        "lower_shadow": "Lower Shadow",
        "range_ratio": "Range Ratio",
        "higher_highs": "Higher Highs Freq",
        "lower_lows": "Lower Lows Freq",
        "close_to_high": "Close vs 20D High",
        "close_to_low": "Close vs 20D Low",
        "lag_return_1": "Lag Return (1D)",
        "lag_return_2": "Lag Return (2D)",
        "lag_return_3": "Lag Return (3D)",
    }

    def explain_prediction(
        self,
        features: dict,
        model,
        top_k: int = 10,
    ) -> dict:
        """Generate explanation for a prediction using permutation importance."""
        feature_names = FeatureEngine.FEATURE_NAMES
        feature_values = np.array([[features[f] for f in feature_names]])

        # Get baseline prediction
        baseline_prob = float(model.predict(feature_values)[0])

        # Permutation importance: shuffle each feature and measure impact
        importances = []
        for i, fname in enumerate(feature_names):
            # Create perturbed version
            perturbed = feature_values.copy()
            perturbed[0, i] = np.random.uniform(-1, 1)  # Random shuffle

            # Measure prediction change
            perturbed_prob = float(model.predict(perturbed)[0])
            importance = abs(baseline_prob - perturbed_prob)

            # Determine direction: does this feature push prediction up or down?
            direction = "bullish" if baseline_prob > 0.5 else "bearish"

            # Check feature contribution direction
            feature_val = features[fname]
            if fname in ["return_1d", "return_5d", "return_10d", "return_20d",
                         "roc_5", "roc_10", "roc_20", "sma_ratio_5", "sma_ratio_10",
                         "sma_ratio_20", "sma_ratio_50", "ema_ratio_12", "ema_ratio_26"]:
                if feature_val > 1.0:
                    direction = "bullish"
                elif feature_val < 1.0:
                    direction = "bearish"
            elif fname in ["rsi_14", "rsi_7"]:
                if feature_val < 30:
                    direction = "bullish"  # Oversold = bullish
                elif feature_val > 70:
                    direction = "bearish"  # Overbought = bearish
            elif fname == "bb_position":
                direction = "bullish" if feature_val > 0.5 else "bearish"
            elif fname in ["volume_ratio_5", "volume_ratio_20"]:
                direction = "bullish" if feature_val > 1.0 else "bearish"

            importances.append({
                "feature": fname,
                "label": self.FEATURE_LABELS.get(fname, fname),
                "value": round(float(feature_val), 4),
                "importance": round(importance, 6),
                "direction": direction,
            })

        # Sort by importance
        importances.sort(key=lambda x: x["importance"], reverse=True)

        # Normalize importances to sum to 1.0
        total_imp = sum(imp["importance"] for imp in importances) or 1.0
        for imp in importances:
            imp["contribution"] = round(imp["importance"] / total_imp, 4)

        # Generate summary
        top_factors = importances[:top_k]
        summary = self._generate_summary(top_factors, baseline_prob)

        return {
            "topFactors": top_factors[:top_k],
            "summary": summary,
            "featureImportances": {
                imp["label"]: imp["contribution"]
                for imp in importances[:15]
            },
        }

    def _generate_summary(self, factors: list, probability: float) -> str:
        """Generate human-readable explanation from top factors."""
        direction = "bullish" if probability > 0.5 else "bearish"
        confidence = abs(probability - 0.5) * 2

        parts = []

        # Primary driver
        if factors:
            top = factors[0]
            parts.append(
                f"Prediction is {direction} primarily driven by {top['label'].lower()} "
                f"({top['direction']})"
            )

        # Secondary drivers
        for factor in factors[1:3]:
            parts.append(f"{factor['label'].lower()} ({factor['direction']})")

        # Confidence qualifier
        if confidence > 0.6:
            qualifier = "High confidence"
        elif confidence > 0.3:
            qualifier = "Moderate confidence"
        else:
            qualifier = "Low confidence"

        summary = f"{qualifier}. " + ". ".join(parts) + "."

        return summary


explainability_service = ExplainabilityService()

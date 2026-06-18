"""Predictions router: endpoints for generating ML predictions with explainability."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.mock_predictor import mock_predictor
from app.services.model_manager import model_manager
from app.services.explainability import explainability_service

router = APIRouter()


@router.post("/", response_model=PredictionResponse)
async def create_prediction(request: PredictionRequest):
    if len(request.data) < 5:
        raise HTTPException(
            status_code=400,
            detail="At least 5 data points required for prediction"
        )

    data_dicts = [d.model_dump() for d in request.data]

    # Try real ML model first
    if len(request.data) >= 65:
        ml_result = model_manager.predict(
            ticker=request.ticker,
            data=data_dicts,
            model_type="ENSEMBLE",
        )
        if ml_result is not None:
            # Generate base prediction using mock predictor structure
            result = mock_predictor.predict(ticker=request.ticker, data=data_dicts)

            # Override with ML-specific values
            result["model_agreement"] = ml_result["model_agreement"]
            result["model_versions"] = {
                "ENSEMBLE": "2.0.0-ml",
                "XGBOOST": "2.0.0-ml",
                "RANDOM_FOREST": "2.0.0-ml",
                "LSTM": "2.0.0-ml",
                "TRANSFORMER": "2.0.0-ml",
            }

            # Enhanced explainability using permutation importance
            from app.services.feature_engine import feature_engine
            features = feature_engine.extract_features(data_dicts)
            if features:
                cache_key = f"{request.ticker}_ENSEMBLE"
                if cache_key in model_manager.models:
                    explanation = explainability_service.explain_prediction(
                        features=features,
                        model=model_manager.models[cache_key],
                    )
                    result["explainability"] = explanation

            return PredictionResponse(**result)

    # Fallback to mock predictor
    result = mock_predictor.predict(ticker=request.ticker, data=data_dicts)
    return PredictionResponse(**result)


@router.get("/health")
async def health():
    return {"status": "ok", "model_version": "2.0.0"}

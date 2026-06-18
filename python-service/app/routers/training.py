"""Training router: endpoints for training ML models."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import TrainRequest, TrainResponse
from app.services.model_manager import model_manager

router = APIRouter()


@router.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    """Train a specific model on OHLCV data."""
    if len(request.data) < 65:
        raise HTTPException(
            status_code=400,
            detail="At least 65 data points required for training"
        )

    result = model_manager.train_model(
        ticker=request.ticker,
        model_type=request.model_type,
        data=[d.model_dump() for d in request.data],
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return TrainResponse(
        ticker=result["ticker"],
        model_type=result["model_type"],
        status=result["status"],
        metrics=result["metrics"],
        duration_ms=result["duration_ms"],
    )


@router.post("/train/ensemble")
async def train_ensemble(request: TrainRequest):
    """Train an ensemble of all models."""
    if len(request.data) < 65:
        raise HTTPException(
            status_code=400,
            detail="At least 65 data points required for training"
        )

    result = model_manager.train_ensemble(
        ticker=request.ticker,
        data=[d.model_dump() for d in request.data],
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("/train/history")
async def get_training_history(ticker: str = None):
    """Get training history."""
    return model_manager.get_training_history(ticker)


@router.get("/train/models")
async def list_models():
    """List all saved models."""
    return model_manager.list_models()


@router.delete("/train/models/{ticker}/{model_type}")
async def delete_model(ticker: str, model_type: str):
    """Delete a trained model."""
    deleted = model_manager.delete_model(ticker, model_type)
    if not deleted:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"status": "deleted", "ticker": ticker, "model_type": model_type}

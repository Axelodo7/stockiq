"""Backtesting router: endpoints for running backtests."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import BacktestRequest, BacktestResponse
from app.services.model_manager import model_manager
from app.services.backtester import backtest_engine

router = APIRouter()


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """Run a backtest using a trained model."""
    if len(request.data) < 70:
        raise HTTPException(
            status_code=400,
            detail="At least 70 data points required for backtesting"
        )

    model_type = request.model_type.upper()
    cache_key = f"{request.ticker}_{model_type}"

    # Try to load model
    if cache_key not in model_manager.models:
        import os
        model_path = model_manager._model_path(request.ticker, model_type)
        if os.path.exists(model_path):
            if model_type == "ENSEMBLE":
                from app.services.models.ensemble import EnsembleModel
                model = EnsembleModel()
            elif model_type in model_manager.MODEL_REGISTRY:
                model = model_manager.MODEL_REGISTRY[model_type]()
            else:
                raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")
            model.load(model_path)
            model_manager.models[cache_key] = model
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No trained model found for {request.ticker}/{model_type}. Train first."
            )

    model = model_manager.models[cache_key]

    result = backtest_engine.run(
        data=[d.model_dump() for d in request.data],
        model=model,
        initial_capital=request.initial_capital,
        commission=request.commission,
        slippage_bps=request.slippage_bps,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return BacktestResponse(
        ticker=result["ticker"],
        model_type=model_type,
        total_return=result["total_return"],
        annualized_return=result["annualized_return"],
        sharpe_ratio=result["sharpe_ratio"],
        max_drawdown=result["max_drawdown"],
        win_rate=result["win_rate"],
        profit_factor=result["profit_factor"],
        total_trades=result["total_trades"],
        equity_curve=result["equity_curve"],
        trades=result["trades"],
        initial_capital=result["initial_capital"],
        final_capital=result["final_capital"],
        total_fees=result["total_fees"],
        commission_per_share=result["commission_per_share"],
        slippage_bps=result["slippage_bps"],
        gross_return=result["gross_return"],
    )


@router.get("/backtest/health")
async def health():
    return {"status": "ok", "service": "backtester"}

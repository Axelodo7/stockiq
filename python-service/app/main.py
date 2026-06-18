from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predictions, indicators, training, backtesting, ai_router
from app.config import settings

app = FastAPI(
    title="StockIQ Prediction Service",
    description="AI-powered stock prediction with real ML models (XGBoost, RandomForest, LSTM, Transformer, Ensemble)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router, prefix="/predict", tags=["predictions"])
app.include_router(indicators.router, prefix="/indicators", tags=["indicators"])
app.include_router(training.router, prefix="/ml", tags=["training"])
app.include_router(backtesting.router, prefix="/ml", tags=["backtesting"])
app.include_router(ai_router.router, prefix="/ai", tags=["ai-analysis"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "stockiq-prediction", "version": "2.0.0"}

from pydantic import BaseModel
from datetime import datetime


class OHLCV(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class PredictionRequest(BaseModel):
    ticker: str
    data: list[OHLCV]


class PredictionWindow(BaseModel):
    days: int
    label: str
    price: float
    confidence: float
    changePercent: float


class PredictionFactor(BaseModel):
    indicator: str
    label: str = ""
    contribution: float
    direction: str
    value: float = 0.0


class RiskAnalysis(BaseModel):
    bullishProbability: float
    bearishProbability: float
    volatilityForecast: float
    riskRating: str


class Explainability(BaseModel):
    topFactors: list[PredictionFactor]
    summary: str
    featureImportances: dict[str, float] = {}


class PredictionResponse(BaseModel):
    ticker: str
    current_price: float
    windows: list[PredictionWindow]
    risk: RiskAnalysis
    model_agreement: float
    uncertainty: float
    explainability: Explainability
    model_versions: dict[str, str]
    disclaimer: str


class TrainRequest(BaseModel):
    ticker: str
    data: list[OHLCV]
    model_type: str = "XGBOOST"


class TrainResponse(BaseModel):
    ticker: str
    model_type: str
    status: str
    metrics: dict
    duration_ms: int


class BacktestRequest(BaseModel):
    ticker: str
    data: list[OHLCV]
    model_type: str = "ENSEMBLE"
    initial_capital: float = 10000.0
    commission: float = 0.005
    slippage_bps: float = 5.0


class BacktestResponse(BaseModel):
    ticker: str
    model_type: str
    total_return: float
    annualized_return: float | None
    sharpe_ratio: float | None
    max_drawdown: float
    win_rate: float
    profit_factor: float | None
    total_trades: int
    equity_curve: list[dict]
    trades: list[dict]
    initial_capital: float = 10000.0
    final_capital: float = 10000.0
    total_fees: float = 0.0
    commission_per_share: float = 0.005
    slippage_bps: float = 5.0
    gross_return: float = 0.0


class IndicatorRequest(BaseModel):
    data: list[OHLCV]
    indicators: list[str]


class IndicatorResponse(BaseModel):
    indicators: dict[str, list[float | None]]

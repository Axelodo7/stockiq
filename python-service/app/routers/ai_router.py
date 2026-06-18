"""AI Routers — endpoints for AI analysis, market summary, trends, risk, and earnings."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schemas import OHLCV
from app.services.ai_analyst import generate_analysis
from app.services.market_summarizer import summarize_market
from app.services.trend_detector import detect_trends
from app.services.risk_analyzer import analyze_portfolio_risk
from app.services.earnings_analyzer import analyze_earnings

router = APIRouter()


class AnalysisRequest(BaseModel):
    ticker: str
    data: list[OHLCV]


class MarketSummaryRequest(BaseModel):
    stocks: dict[str, list[OHLCV]]


class TrendRequest(BaseModel):
    ticker: str
    data: list[OHLCV]


class PortfolioRiskRequest(BaseModel):
    positions: dict[str, list[OHLCV]]
    weights: dict[str, float] | None = None


class EarningsRequest(BaseModel):
    ticker: str
    data: list[OHLCV]
    earnings_date: str | None = None
    reported_eps: float | None = None
    expected_eps: float | None = None
    revenue: float | None = None


@router.post("/analyze")
async def analyze_stock(req: AnalysisRequest):
    if not req.data:
        raise HTTPException(status_code=400, detail="No data provided")
    result = generate_analysis(req.ticker, req.data)
    return {"success": True, "data": result}


@router.post("/market-summary")
async def market_summary(req: MarketSummaryRequest):
    if not req.stocks:
        raise HTTPException(status_code=400, detail="No stocks provided")
    result = summarize_market(req.stocks)
    return {"success": True, "data": result}


@router.post("/trends")
async def get_trends(req: TrendRequest):
    if not req.data:
        raise HTTPException(status_code=400, detail="No data provided")
    result = detect_trends(req.ticker, req.data)
    return {"success": True, "data": result}


@router.post("/portfolio-risk")
async def portfolio_risk(req: PortfolioRiskRequest):
    if not req.positions:
        raise HTTPException(status_code=400, detail="No positions provided")
    result = analyze_portfolio_risk(req.positions, req.weights)
    return {"success": True, "data": result}


@router.post("/earnings")
async def earnings_analysis(req: EarningsRequest):
    if not req.data:
        raise HTTPException(status_code=400, detail="No data provided")
    result = analyze_earnings(
        req.ticker,
        req.data,
        earnings_date=req.earnings_date,
        reported_eps=req.reported_eps,
        expected_eps=req.expected_eps,
        revenue=req.revenue,
    )
    return {"success": True, "data": result}

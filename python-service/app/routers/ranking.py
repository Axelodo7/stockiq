"""Stock ranking router: ranks a universe of tickers with trained ML models."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ranker import ranker

router = APIRouter()


class RankRequest(BaseModel):
    """Request payload: ticker -> OHLCV series (oldest first)."""

    universe: dict[str, list[dict]]
    model_type: str = "ENSEMBLE"
    limit: int = 20


class RankedStock(BaseModel):
    ticker: str
    probability: float
    direction: str
    confidence: float
    model_agreement: float
    model_type: str
    momentum_20d: float
    last_close: float


class RankResponse(BaseModel):
    rankings: list[RankedStock]
    model_type: str
    scored_count: int
    universe_count: int


@router.post("/rank", response_model=RankResponse)
async def rank_stocks(request: RankRequest):
    """Rank stocks by ML-predicted probability of a bullish outcome."""
    if not request.universe:
        raise HTTPException(status_code=400, detail="universe must not be empty")

    rankings = ranker.rank(
        universe=request.universe,
        model_type=request.model_type,
        limit=min(request.limit, 100),
    )

    return RankResponse(
        rankings=[RankedStock(**r) for r in rankings],
        model_type=request.model_type.upper(),
        scored_count=len(rankings),
        universe_count=len(request.universe),
    )


@router.get("/rank/health")
async def health():
    return {"status": "ok", "service": "ranker"}

from fastapi import APIRouter
from app.models.schemas import IndicatorRequest, IndicatorResponse
from app.services.indicators import IndicatorService

router = APIRouter()
service = IndicatorService()


@router.post("/", response_model=IndicatorResponse)
async def calculate_indicators(request: IndicatorRequest):
    result = service.calculate(
        data=[d.model_dump() for d in request.data],
        indicators=request.indicators,
    )
    return IndicatorResponse(indicators=result)

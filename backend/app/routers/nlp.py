from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.groq_service import GroqService

router = APIRouter(prefix="/api/v1/nlp", tags=["nlp"])

class SentimentRequest(BaseModel):
    headlines: list[str]

@router.post("/sentiment")
async def analyze_sentiment(req: SentimentRequest):
    """
    Sends recent market headlines to Groq API to determine real-time sentiment multiplier.
    """
    try:
        groq_service = GroqService()
        result = groq_service.analyze_sentiment(req.headlines)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


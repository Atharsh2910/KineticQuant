from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/hedge", tags=["price-hedge"])

class AnalyzeHedgeRequest(BaseModel):
    sme_id: str

class ApplyHedgeRequest(BaseModel):
    action_id: str

@router.post("/analyze")
async def analyze_price_hedge(req: AnalyzeHedgeRequest):
    """
    Analyzes commodity price movements for an SME's supply chain dependencies 
    and generates recommended storefront price adjustments to protect gross margins.
    """
    try:
        from app.services.price_hedge_service import PriceHedgeService
        service = PriceHedgeService()
        result = service.analyze_price_impact(req.sme_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply")
async def apply_hedge_action(req: ApplyHedgeRequest):
    """
    Applies a recommended price hedge action, marking it as executed.
    """
    try:
        from app.services.price_hedge_service import PriceHedgeService
        service = PriceHedgeService()
        result = service.apply_hedge_action(req.action_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{sme_id}")
async def get_hedge_history(sme_id: str):
    """
    Retrieves the history of all price hedge actions for an SME.
    """
    try:
        from app.services.supabase_client import supabase
        resp = supabase.table("price_hedge_actions").select("*").eq("sme_id", sme_id).order("created_at", desc=True).execute()
        return {"status": "success", "data": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


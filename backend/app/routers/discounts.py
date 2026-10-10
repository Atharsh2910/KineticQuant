from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/discounts", tags=["discount-engine"])

class AnalyzeDiscountRequest(BaseModel):
    sme_id: str

class DiscountActionRequest(BaseModel):
    action_id: str

@router.post("/analyze")
async def analyze_discounts(req: AnalyzeDiscountRequest):
    """
    Analyzes the SME's cash position and generates AR/AP early payment discount proposals.
    AR: Offer buyers a discount for early payment when cash is tight.
    AP: Offer early payment to suppliers for a discount when cash is surplus.
    """
    try:
        from app.services.discount_engine_service import DiscountEngineService
        service = DiscountEngineService()
        result = service.analyze_discounts(req.sme_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_discount(req: DiscountActionRequest):
    """
    Executes a discount action (sends offer to buyer or pays supplier early).
    """
    try:
        from app.services.discount_engine_service import DiscountEngineService
        service = DiscountEngineService()
        result = service.execute_discount(req.action_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{sme_id}")
async def get_discount_history(sme_id: str):
    """
    Retrieves all discount actions for an SME.
    """
    try:
        from app.services.supabase_client import supabase
        resp = supabase.table("discount_actions").select("*").eq("sme_id", sme_id).order("created_at", desc=True).execute()
        return {"status": "success", "data": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


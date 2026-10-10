from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/arbitrage", tags=["vendor-arbitrage"])

class AnalyzeArbitrageRequest(BaseModel):
    sme_id: str

class ArbitrageActionRequest(BaseModel):
    action_id: str

@router.post("/analyze")
async def analyze_vendor_arbitrage(req: AnalyzeArbitrageRequest):
    """
    Runs the agentic multi-vendor inventory arbitrage analysis using LangChain + Groq.
    Evaluates global supplier pricing, FX rates, and freight costs to find procurement savings.
    """
    try:
        from app.services.vendor_arbitrage_service import VendorArbitrageService
        service = VendorArbitrageService()
        result = service.analyze_arbitrage(req.sme_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_arbitrage(req: ArbitrageActionRequest):
    """
    Executes a vendor arbitrage action, re-routing order volume to the alternative supplier.
    """
    try:
        from app.services.vendor_arbitrage_service import VendorArbitrageService
        service = VendorArbitrageService()
        result = service.execute_arbitrage(req.action_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{sme_id}")
async def get_arbitrage_history(sme_id: str):
    """
    Retrieves all vendor arbitrage actions for an SME.
    """
    try:
        from app.services.supabase_client import supabase
        resp = supabase.table("vendor_arbitrage_actions").select("*").eq("sme_id", sme_id).order("created_at", desc=True).execute()
        return {"status": "success", "data": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


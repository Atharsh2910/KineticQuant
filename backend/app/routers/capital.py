from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/capital", tags=["capital-drawdowns"])

class AnalyzeDrawdownRequest(BaseModel):
    sme_id: str

class DrawdownActionRequest(BaseModel):
    drawdown_id: str

@router.post("/analyze")
async def analyze_cash_position(req: AnalyzeDrawdownRequest):
    """
    Analyzes the SME's projected cash position and proposes a just-in-time capital
    drawdown if a negative cash gap is detected before AP obligations are due.
    """
    try:
        from app.services.capital_drawdown_service import CapitalDrawdownService
        service = CapitalDrawdownService()
        result = service.analyze_cash_position(req.sme_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_drawdown(req: DrawdownActionRequest):
    """
    Executes a proposed capital drawdown, drawing the exact amount from the credit line.
    """
    try:
        from app.services.capital_drawdown_service import CapitalDrawdownService
        service = CapitalDrawdownService()
        result = service.execute_drawdown(req.drawdown_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/repay")
async def repay_drawdown(req: DrawdownActionRequest):
    """
    Marks a drawdown as repaid once AR collections have landed.
    """
    try:
        from app.services.capital_drawdown_service import CapitalDrawdownService
        service = CapitalDrawdownService()
        result = service.repay_drawdown(req.drawdown_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{sme_id}")
async def get_drawdown_history(sme_id: str):
    """
    Retrieves all capital drawdown actions for an SME.
    """
    try:
        from app.services.supabase_client import supabase
        resp = supabase.table("capital_drawdowns").select("*").eq("sme_id", sme_id).order("created_at", desc=True).execute()
        return {"status": "success", "data": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


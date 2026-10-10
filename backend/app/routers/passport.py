from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/passport", tags=["credit-passport"])

class GeneratePassportRequest(BaseModel):
    sme_id: str

@router.post("/generate")
async def generate_passport(req: GeneratePassportRequest):
    """
    Generates a verifiable Dynamic Credit Passport for an SME based on their 
    current Fuse Score and financial health metrics. Returns a shareable token.
    """
    try:
        from app.services.credit_passport_service import CreditPassportService
        service = CreditPassportService()
        result = service.generate_passport(req.sme_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{token}")
async def verify_passport(token: str):
    """
    Public endpoint: Verifies a credit passport by its shareable token.
    Returns financial health summary without sensitive internal data.
    """
    try:
        from app.services.credit_passport_service import CreditPassportService
        service = CreditPassportService()
        result = service.verify_passport(token)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{sme_id}")
async def list_passports(sme_id: str):
    """
    Lists all credit passports for an SME.
    """
    try:
        from app.services.credit_passport_service import CreditPassportService
        service = CreditPassportService()
        result = service.list_passports(sme_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


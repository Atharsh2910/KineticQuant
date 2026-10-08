from fastapi import APIRouter, HTTPException
from app.services.serpapi_service import SerpApiService
from app.services.supabase_client import supabase

router = APIRouter(prefix="/api/v1/market", tags=["market"])

@router.get("/sync")
async def sync_market_data():
    """
    Cron-triggered endpoint that batches requests to engine=google_finance_markets 
    and updates market_time_series table in Supabase based on dynamic SME dependencies.
    """
    try:
        serpapi = SerpApiService()
        inserted_count = 0
        
        # Fetch dynamic dependencies from SME profiles
        sme_resp = supabase.table("sme_profiles").select("supply_chain_dependencies").execute()
        tickers = set()
        if sme_resp.data:
            for sme in sme_resp.data:
                deps = sme.get("supply_chain_dependencies")
                if isinstance(deps, list):
                    for dep in deps:
                        if dep:
                            tickers.add(str(dep).strip().upper())
        
        for ticker in tickers:
            data = serpapi.get_finance_data(ticker)
            if data and "markets" in data or "summary" in data:
                record = {
                    "ticker": ticker,
                    "payload": data
                }
                supabase.table("market_time_series").insert(record).execute()
                inserted_count += 1

        return {"status": "success", "message": f"Synced {inserted_count} market records."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.supabase_client import supabase
from app.services.serpapi_service import SerpApiService
from app.services.groq_service import GroqService
from app.engines.deterministic_engine import DeterministicEngine
from app.engines.predictive_engine import PredictiveEngine
from app.engines.fuse_engine import FuseEngine
import json

router = APIRouter(prefix="/api/v1/engine", tags=["engine"])

class CalculateFuseRequest(BaseModel):
    sme_id: str
    lender_id: str

@router.post("/calculate_fuse")
async def calculate_fuse(req: CalculateFuseRequest):
    try:
        # 1. Fetch current SME ledger
        sme_resp = supabase.table("sme_profiles").select("*").eq("id", req.sme_id).eq("lender_id", req.lender_id).execute()
        if not sme_resp.data:
            raise HTTPException(status_code=404, detail="SME not found or unauthorized.")
        
        sme_data = sme_resp.data[0]
        sme_name = sme_data.get("name", "Unknown SME")
        sme_deps = sme_data.get("supply_chain_dependencies", [])
        if not isinstance(sme_deps, list):
            sme_deps = []
        
        ledger_resp = supabase.table("financial_ledgers").select("*").eq("sme_id", req.sme_id).order("recorded_at", desc=True).limit(5).execute()
        if not ledger_resp.data:
            raise HTTPException(status_code=404, detail="No ledger data found for SME.")
        
        current_ledger = ledger_resp.data[0]
        transaction_history = [float(l.get("cash_on_hand", 0)) for l in reversed(ledger_resp.data)]
        
        # 2. Base Score
        base_result = DeterministicEngine.calculate_base_score(current_ledger)
        
        # 3. Fetch Macro Data dynamically based on SME dependencies
        macro_data = []
        for dep in sme_deps:
            macro_resp = supabase.table("market_time_series").select("payload").eq("ticker", dep).order("recorded_at", desc=True).limit(10).execute()
            for row in reversed(macro_resp.data):
                try:
                    payload = row.get("payload", {})
                    # Parse SerpApi Google Finance payload to extract actual price
                    if "summary" in payload and "price" in payload["summary"]:
                        # Extract numerical value from price string e.g., "$123.45"
                        price_str = str(payload["summary"]["price"]).replace('$', '').replace(',', '')
                        macro_data.append(float(price_str))
                    elif "price" in payload:
                        macro_data.append(float(payload["price"]))
                except (ValueError, TypeError, AttributeError):
                    continue
            
        # 4. Delta Score
        pred_engine = PredictiveEngine()
        delta_result = pred_engine.calculate_delta(transaction_history, macro_data)
        
        # 5. NLP Sentiment dynamically based on SerpApi news
        serpapi = SerpApiService()
        headlines = []
        for dep in sme_deps:
            finance_data = serpapi.get_finance_data(dep)
            if finance_data and "news_results" in finance_data:
                for news in finance_data["news_results"]:
                    title = news.get("title")
                    if title:
                        headlines.append(f"{dep}: {title}")
                        
        if not headlines:
            headlines.append(f"No recent notable market news found regarding {sme_name}'s dependencies.")

        groq_service = GroqService()
        sentiment_result = groq_service.analyze_sentiment(headlines)
        
        # 6. Fuse Score
        fuse_result = FuseEngine.calculate_fuse(
            base_score=base_result["base_score"],
            delta_score=delta_result["delta_score"],
            sentiment_multiplier=sentiment_result.get("sentiment_multiplier", 1.0)
        )
        
        # Compile total CoT
        full_cot = {
            "deterministic_cot": base_result["cot_explanation"],
            "predictive_cot": delta_result["cot_explanation"],
            "nlp_cot": sentiment_result.get("cot_explanation", "No sentiment explanation provided."),
            "fuse_cot": fuse_result["cot_explanation"]
        }
        
        # 7. Persist to Supabase
        history_record = {
            "sme_id": req.sme_id,
            "fuse_score": fuse_result["fuse_score"],
            "base_score": base_result["base_score"],
            "delta_score": delta_result["delta_score"],
            "sentiment_multiplier": sentiment_result.get("sentiment_multiplier", 1.0),
            "cot_explanation": full_cot
        }
        
        insert_resp = supabase.table("fuse_score_history").insert(history_record).execute()
        
        return {
            "status": "success",
            "fuse_score": fuse_result["fuse_score"],
            "parametric_rate": 15.0 - (fuse_result["fuse_score"] / 10.0),
            "explanation": full_cot,
            "record_id": insert_resp.data[0]["id"] if insert_resp.data else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


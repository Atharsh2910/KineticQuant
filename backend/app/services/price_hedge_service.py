import logging
from typing import Dict, Any, List
from app.services.supabase_client import supabase
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

class PriceHedgeService:
    def __init__(self):
        self.groq_service = GroqService()

    def analyze_price_impact(self, sme_id: str) -> Dict[str, Any]:
        try:
            # 1. Fetch the SME's supply_chain_dependencies from sme_profiles table
            sme_response = supabase.table("sme_profiles").select("*").eq("id", sme_id).execute()
            if not sme_response.data:
                raise ValueError(f"SME with ID {sme_id} not found")
            sme_profile = sme_response.data[0]
            dependencies = sme_profile.get("supply_chain_dependencies", [])

            hedge_actions = []

            # 2. For each dependency/commodity, fetch the latest 2 records from market_time_series table
            for dependency in dependencies:
                commodity = dependency.get("commodity", "") if isinstance(dependency, dict) else dependency
                if not commodity:
                    continue

                market_response = supabase.table("market_time_series").select("*").eq("ticker", commodity).order("recorded_at", desc=True).limit(2).execute()
                records = market_response.data

                if len(records) < 2:
                    logger.warning(f"Not enough market data for commodity {commodity} to analyze price impact.")
                    continue

                # 3. Calculate the percentage price change
                latest_payload = records[0].get("payload", {})
                previous_payload = records[1].get("payload", {})
                
                latest_price = latest_payload.get("price")
                previous_price = previous_payload.get("price")

                if latest_price is None or previous_price is None:
                    # try pct_change_24h
                    price_change_pct = latest_payload.get("pct_change_24h", 0)
                else:
                    if previous_price == 0:
                        price_change_pct = 0
                    else:
                        price_change_pct = ((latest_price - previous_price) / previous_price) * 100

                # 4. If price change > 5%
                if abs(price_change_pct) > 5.0:
                    cost_weight_factor = 0.35
                    adjustment_pct = price_change_pct * cost_weight_factor
                    
                    # 5. Use GroqService to generate a CoT explanation
                    prompt_headline = f"Market price for {commodity} changed by {price_change_pct:.2f}%. Analyzing impact for SME {sme_profile.get('name')}."
                    groq_analysis = self.groq_service.analyze_sentiment([prompt_headline])
                    
                    # 6. Insert a record into price_hedge_actions table
                    action_data = {
                        "sme_id": sme_id,
                        "ticker": commodity,
                        "price_change_pct": price_change_pct,
                        "recommended_adjustment_pct": adjustment_pct,
                        "affected_products": {"categories": ["all_dependent_products"]},
                        "status": "pending",
                        "cot_explanation": groq_analysis.get("cot_explanation", {"reason": "Automated hedge based on price fluctuation"})
                    }
                    
                    insert_response = supabase.table("price_hedge_actions").insert(action_data).execute()
                    if insert_response.data:
                        hedge_actions.append(insert_response.data[0])

            return {"status": "success", "data": hedge_actions}

        except Exception as e:
            logger.error(f"Error in analyze_price_impact: {str(e)}")
            return {"status": "error", "message": str(e)}

    def apply_hedge_action(self, action_id: str) -> Dict[str, Any]:
        try:
            update_response = supabase.table("price_hedge_actions").update({"status": "applied"}).eq("id", action_id).execute()
            if not update_response.data:
                raise ValueError(f"Action with ID {action_id} not found or could not be updated")
            return {"status": "success", "data": update_response.data[0]}
        except Exception as e:
            logger.error(f"Error in apply_hedge_action: {str(e)}")
            return {"status": "error", "message": str(e)}

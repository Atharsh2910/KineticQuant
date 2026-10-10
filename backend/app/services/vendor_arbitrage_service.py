import logging
from typing import Dict, Any, List
from app.services.supabase_client import supabase
from app.services.groq_service import GroqService
from app.services.serpapi_service import SerpApiService
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

class VendorArbitrageService:
    def __init__(self):
        self.groq_service = GroqService()
        self.serpapi_service = SerpApiService()

    def analyze_arbitrage(self, sme_id: str) -> Dict[str, Any]:
        try:
            # 1. Fetch SME dependencies
            sme_response = supabase.table("sme_profiles").select("*").eq("id", sme_id).execute()
            if not sme_response.data:
                raise ValueError(f"SME with ID {sme_id} not found")
            sme_profile = sme_response.data[0]
            dependencies = sme_profile.get("supply_chain_dependencies", [])

            proposals = []

            for dependency in dependencies:
                commodity = dependency.get("commodity", "") if isinstance(dependency, dict) else dependency
                if not commodity:
                    continue

                # 2. Get market data
                finance_data = self.serpapi_service.get_finance_data(commodity)
                market_trends = self.serpapi_service.get_markets_data('commodities')

                # Prepare mock base values if real API fails
                primary_vendor = f"{commodity}_Primary_Supplier"
                primary_cost = 100.0

                if finance_data and "summary" in finance_data and "price" in finance_data["summary"]:
                    try:
                        primary_cost = float(finance_data["summary"]["price"].replace('$', '').replace(',', ''))
                    except:
                        pass

                result_data = None

                # 4. Try Langchain
                if HAS_LANGCHAIN:
                    try:
                        llm = ChatGroq(temperature=0, groq_api_key=settings.GROQ_API_KEY, model_name="llama-3.3-70b-versatile")
                        parser = JsonOutputParser()
                        prompt = ChatPromptTemplate.from_template(
                            "Analyze alternative sourcing for {commodity} currently priced at {primary_cost}. "
                            "Consider market trends: {market_trends}. "
                            "Provide a JSON response with the following keys exactly: "
                            "alternative_vendor (string), alternative_unit_cost (number), potential_savings_pct (number), recommended_volume_shift_pct (number), reasoning (string). "
                            "Output ONLY valid JSON."
                        )
                        chain = prompt | llm | parser
                        result_data = chain.invoke({
                            "commodity": commodity,
                            "primary_cost": primary_cost,
                            "market_trends": str(market_trends)[:500]
                        })
                    except Exception as e:
                        logger.warning(f"LangChain failed, falling back to GroqService: {e}")
                
                if not result_data:
                    # Fallback to standard GroqService
                    prompt_text = f"Propose vendor arbitrage for {commodity} (current cost: {primary_cost}). Estimate an alternative vendor, cost, savings percentage, and volume shift percentage."
                    analysis = self.groq_service.analyze_sentiment([prompt_text])
                    # Mock parsing for fallback
                    result_data = {
                        "alternative_vendor": "Global_Alt_Supplier_Inc",
                        "alternative_unit_cost": primary_cost * 0.85,
                        "potential_savings_pct": 15.0,
                        "recommended_volume_shift_pct": 30.0,
                        "reasoning": analysis.get("cot_explanation", {}).get("reason", "Fallback generic reasoning")
                    }

                # 5. Extract data
                alt_vendor = result_data.get("alternative_vendor", "Unknown Alternative")
                alt_cost = result_data.get("alternative_unit_cost", primary_cost * 0.9)
                savings = result_data.get("potential_savings_pct", 10.0)
                vol_shift = result_data.get("recommended_volume_shift_pct", 20.0)
                reasoning = {"reason": result_data.get("reasoning", "LangChain generated reasoning")}

                # 6. Insert
                action_data = {
                    "sme_id": sme_id,
                    "primary_vendor": primary_vendor,
                    "alternative_vendor": alt_vendor,
                    "commodity": commodity,
                    "primary_unit_cost": primary_cost,
                    "alternative_unit_cost": alt_cost,
                    "potential_savings_pct": savings,
                    "recommended_volume_shift_pct": vol_shift,
                    "fx_rate_used": 1.0,
                    "freight_cost_delta": 0.0,
                    "status": "proposed",
                    "agent_reasoning": reasoning
                }

                insert_response = supabase.table("vendor_arbitrage_actions").insert(action_data).execute()
                if insert_response.data:
                    proposals.append(insert_response.data[0])

            return {"status": "success", "data": proposals}

        except Exception as e:
            logger.error(f"Error in analyze_arbitrage: {str(e)}")
            return {"status": "error", "message": str(e)}

    def execute_arbitrage(self, action_id: str) -> Dict[str, Any]:
        try:
            update_response = supabase.table("vendor_arbitrage_actions").update({"status": "executed"}).eq("id", action_id).execute()
            if not update_response.data:
                raise ValueError(f"Action {action_id} not found")
            return {"status": "success", "data": update_response.data[0]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

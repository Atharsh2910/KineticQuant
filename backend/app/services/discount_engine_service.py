import logging
from typing import Dict, Any
from app.services.supabase_client import supabase
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

class DiscountEngineService:
    def __init__(self):
        self.groq_service = GroqService()

    def analyze_discounts(self, sme_id: str) -> Dict[str, Any]:
        try:
            # 1. Fetch latest ledger
            ledger_response = supabase.table("financial_ledgers").select("*").eq("sme_id", sme_id).order("recorded_at", desc=True).limit(1).execute()
            if not ledger_response.data:
                raise ValueError(f"No financial ledger found for SME {sme_id}")
            ledger = ledger_response.data[0]

            cash_on_hand = ledger.get("cash_on_hand", 0)
            accounts_payable = ledger.get("accounts_payable", 0)
            accounts_receivable = ledger.get("accounts_receivable", 0)
            inventory_holding_costs = ledger.get("inventory_holding_costs", 0)

            # 2. Compute cash surplus
            cash_surplus = cash_on_hand - accounts_payable - inventory_holding_costs
            proposals = []

            # 3. AR-side
            if cash_surplus < 10000 and accounts_receivable > 0:
                discount_pct = 2.0
                days_early = 30
                ann_yield = (discount_pct / days_early) * 365
                discounted_amount = accounts_receivable * (1 - (discount_pct / 100))
                
                analysis = self.groq_service.analyze_sentiment([f"Cash surplus is low. Recommending AR discount of {discount_pct}% to free up capital."])

                action_data = {
                    "sme_id": sme_id,
                    "direction": "AR",
                    "counterparty_name": "Major Buyer Corp",
                    "original_amount": accounts_receivable,
                    "discount_pct": discount_pct,
                    "discounted_amount": discounted_amount,
                    "days_early": days_early,
                    "annualized_yield": ann_yield,
                    "status": "proposed",
                    "cot_explanation": analysis.get("cot_explanation", {"reason": "Low liquidity, offering AR discount."})
                }
                insert_response = supabase.table("discount_actions").insert(action_data).execute()
                if insert_response.data:
                    proposals.append(insert_response.data[0])

            # 4. AP-side
            if cash_surplus > 50000 and accounts_payable > 0:
                discount_pct = 1.5
                days_early = 15
                ann_yield = (discount_pct / days_early) * 365
                discounted_amount = accounts_payable * (1 - (discount_pct / 100))

                analysis = self.groq_service.analyze_sentiment([f"High cash surplus. Requesting AP discount of {discount_pct}% for early payment."])

                action_data = {
                    "sme_id": sme_id,
                    "direction": "AP",
                    "counterparty_name": "Key Supplier Inc",
                    "original_amount": accounts_payable,
                    "discount_pct": discount_pct,
                    "discounted_amount": discounted_amount,
                    "days_early": days_early,
                    "annualized_yield": ann_yield,
                    "status": "proposed",
                    "cot_explanation": analysis.get("cot_explanation", {"reason": "Excess liquidity, seeking AP discount yield."})
                }
                insert_response = supabase.table("discount_actions").insert(action_data).execute()
                if insert_response.data:
                    proposals.append(insert_response.data[0])

            return {"status": "success", "data": proposals}

        except Exception as e:
            logger.error(f"Error in analyze_discounts: {str(e)}")
            return {"status": "error", "message": str(e)}

    def execute_discount(self, action_id: str) -> Dict[str, Any]:
        try:
            # Check current to decide new status
            action_response = supabase.table("discount_actions").select("*").eq("id", action_id).execute()
            if not action_response.data:
                raise ValueError(f"Action {action_id} not found")
            
            action = action_response.data[0]
            new_status = "sent" if action["direction"] == "AR" else "accepted"

            update_response = supabase.table("discount_actions").update({"status": new_status}).eq("id", action_id).execute()
            return {"status": "success", "data": update_response.data[0]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

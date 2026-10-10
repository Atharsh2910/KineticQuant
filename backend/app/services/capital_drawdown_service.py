import logging
from typing import Dict, Any
from app.services.supabase_client import supabase
from app.services.groq_service import GroqService
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CapitalDrawdownService:
    def __init__(self):
        self.groq_service = GroqService()

    def analyze_cash_position(self, sme_id: str) -> Dict[str, Any]:
        try:
            # 1. Fetch the latest ledger
            ledger_response = supabase.table("financial_ledgers").select("*").eq("sme_id", sme_id).order("recorded_at", desc=True).limit(1).execute()
            if not ledger_response.data:
                raise ValueError(f"No financial ledger found for SME {sme_id}")
            ledger = ledger_response.data[0]

            cash_on_hand = ledger.get("cash_on_hand", 0)
            accounts_receivable = ledger.get("accounts_receivable", 0)
            accounts_payable = ledger.get("accounts_payable", 0)
            inventory_holding_costs = ledger.get("inventory_holding_costs", 0)

            # 2. Calculate projected cash position
            projected_cash = cash_on_hand + accounts_receivable - accounts_payable - inventory_holding_costs
            safety_threshold = 10000
            safety_buffer = 5000

            # 3. Check condition
            if projected_cash < safety_threshold:
                drawdown_amount = abs(projected_cash) + safety_buffer if projected_cash < 0 else safety_buffer + (safety_threshold - projected_cash)
                
                # 4. Estimate repayment
                expected_repayment_date = (datetime.now() + timedelta(days=30)).date().isoformat()
                
                # 5. CoT explanation
                prompt = f"Projected cash position is {projected_cash}, below safe threshold. Recommending a capital drawdown of {drawdown_amount}."
                analysis = self.groq_service.analyze_sentiment([prompt])

                # 6. Insert record
                drawdown_data = {
                    "sme_id": sme_id,
                    "drawdown_amount": drawdown_amount,
                    "trigger_reason": f"Projected cash position below safety threshold ({projected_cash})",
                    "target_invoice_id": None,
                    "status": "proposed",
                    "repayment_source": "AR collection",
                    "expected_repayment_date": expected_repayment_date,
                    "cot_explanation": analysis.get("cot_explanation", {"reason": "Automated drawdown for liquidity"})
                }

                insert_response = supabase.table("capital_drawdowns").insert(drawdown_data).execute()
                if insert_response.data:
                    return {"status": "success", "data": insert_response.data[0]}
                else:
                    raise Exception("Failed to insert capital drawdown record")

            return {"status": "success", "message": "Cash position is healthy, no drawdown needed.", "data": None}

        except Exception as e:
            logger.error(f"Error in analyze_cash_position: {str(e)}")
            return {"status": "error", "message": str(e)}

    def execute_drawdown(self, drawdown_id: str) -> Dict[str, Any]:
        try:
            update_response = supabase.table("capital_drawdowns").update({"status": "executed"}).eq("id", drawdown_id).execute()
            if not update_response.data:
                raise ValueError(f"Drawdown {drawdown_id} not found")
            return {"status": "success", "data": update_response.data[0]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def repay_drawdown(self, drawdown_id: str) -> Dict[str, Any]:
        try:
            update_response = supabase.table("capital_drawdowns").update({"status": "repaid"}).eq("id", drawdown_id).execute()
            if not update_response.data:
                raise ValueError(f"Drawdown {drawdown_id} not found")
            return {"status": "success", "data": update_response.data[0]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

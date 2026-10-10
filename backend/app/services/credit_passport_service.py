import logging
import uuid
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.services.supabase_client import supabase

logger = logging.getLogger(__name__)

class CreditPassportService:
    def generate_passport(self, sme_id: str) -> Dict[str, Any]:
        try:
            # 1. Fetch SME profile
            sme_response = supabase.table("sme_profiles").select("*").eq("id", sme_id).execute()
            if not sme_response.data:
                raise ValueError(f"SME with ID {sme_id} not found")
            sme = sme_response.data[0]

            # 2. Fetch fuse score
            fuse_response = supabase.table("fuse_score_history").select("*").eq("sme_id", sme_id).order("calculated_at", desc=True).limit(1).execute()
            fuse_score = fuse_response.data[0].get("fuse_score", 0) if fuse_response.data else 0

            # 3. Fetch latest ledger
            ledger_response = supabase.table("financial_ledgers").select("*").eq("sme_id", sme_id).order("recorded_at", desc=True).limit(1).execute()
            ledger = ledger_response.data[0] if ledger_response.data else {}

            cash = ledger.get("cash_on_hand", 0)
            ar = ledger.get("accounts_receivable", 0)
            ap = ledger.get("accounts_payable", 0)
            quick_ratio = (cash + ar) / ap if ap > 0 else 999.99

            # 4. Generate token
            passport_token = str(uuid.uuid4())

            # 5. Build summary
            now = datetime.now().isoformat()
            summary = {
                "sme_name": sme.get("name"),
                "industry": sme.get("industry_category"),
                "fuse_score": fuse_score,
                "quick_ratio": quick_ratio,
                "cash_position_indicator": "Strong" if cash > 50000 else "Stable",
                "ar_balance": ar,
                "ap_balance": ap,
                "generated_at": now,
                "validity_period": "30 days"
            }

            # 6. Set valid_until
            valid_until = (datetime.now() + timedelta(days=30)).isoformat()

            # 7. Insert
            passport_data = {
                "sme_id": sme_id,
                "passport_token": passport_token,
                "fuse_score_snapshot": fuse_score,
                "financial_health_summary": summary,
                "valid_until": valid_until,
                "access_count": 0
            }

            insert_response = supabase.table("credit_passports").insert(passport_data).execute()
            if insert_response.data:
                return {"status": "success", "data": insert_response.data[0]}
            else:
                raise Exception("Failed to generate credit passport")

        except Exception as e:
            logger.error(f"Error generating passport: {str(e)}")
            return {"status": "error", "message": str(e)}

    def verify_passport(self, token: str) -> Dict[str, Any]:
        try:
            # 1. Fetch passport
            response = supabase.table("credit_passports").select("*").eq("passport_token", token).execute()
            if not response.data:
                raise ValueError("Invalid passport token")
            
            passport = response.data[0]
            
            # 2. Check validity
            valid_until = datetime.fromisoformat(passport["valid_until"].replace("Z", "+00:00"))
            if datetime.now(valid_until.tzinfo) > valid_until:
                raise ValueError("Passport has expired")

            # 3. Increment access count
            new_count = passport.get("access_count", 0) + 1
            supabase.table("credit_passports").update({"access_count": new_count}).eq("id", passport["id"]).execute()

            # 4. Return summary
            return {"status": "success", "data": passport["financial_health_summary"]}

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def list_passports(self, sme_id: str) -> Dict[str, Any]:
        try:
            response = supabase.table("credit_passports").select("*").eq("sme_id", sme_id).order("created_at", desc=True).execute()
            return {"status": "success", "data": response.data}
        except Exception as e:
            return {"status": "error", "message": str(e)}

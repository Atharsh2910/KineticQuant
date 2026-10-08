import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from fastapi.testclient import TestClient
from app.main import app
from app.services.supabase_client import supabase
import uuid

client = TestClient(app)

def run_verification():
    print("--- Starting Pipeline Verification ---")
    
    # 1. Create a Mock SME Profile
    lender_id = str(uuid.uuid4())
    sme_data = {
        "lender_id": lender_id,
        "name": "Test Manufacturing Co.",
        "industry_category": "Manufacturing",
        "supply_chain_dependencies": ["COTTON", "LITHIUM"]
    }
    print("1. Inserting Mock SME...")
    sme_resp = supabase.table("sme_profiles").insert(sme_data).execute()
    sme_id = sme_resp.data[0]["id"]
    print(f"   Created SME with ID: {sme_id}")
    
    # 2. Create a Mock Ledger for SME
    ledger_data = {
        "sme_id": sme_id,
        "cash_on_hand": 50000.0,
        "accounts_payable": 20000.0,
        "accounts_receivable": 30000.0,
        "inventory_holding_costs": 5000.0
    }
    print("2. Inserting Mock Financial Ledger...")
    supabase.table("financial_ledgers").insert(ledger_data).execute()
    
    # 3. Call the API
    print("3. Calling /api/v1/engine/calculate_fuse...")
    payload = {
        "sme_id": sme_id,
        "lender_id": lender_id
    }
    response = client.post("/api/v1/engine/calculate_fuse", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Success! Fuse Score: {result['fuse_score']}")
        print(f"   Explanation: {result['explanation']}")
        
        # 4. Verify Persistence
        record_id = result.get("record_id")
        if record_id:
            print("4. Verifying Supabase Persistence...")
            verify_resp = supabase.table("fuse_score_history").select("*").eq("id", record_id).execute()
            if verify_resp.data:
                print("   Record successfully found in Supabase.")
            else:
                print("   Failed to find record in Supabase.")
    else:
        print(f"   API Error: {response.status_code} - {response.text}")
        
    # Cleanup (Optional)
    print("5. Cleaning up mock data...")
    supabase.table("sme_profiles").delete().eq("id", sme_id).execute()
    print("--- Pipeline Verification Complete ---")

if __name__ == "__main__":
    run_verification()


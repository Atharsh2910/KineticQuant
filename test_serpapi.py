import sys
import os
sys.path.append(os.path.abspath('backend'))
from app.services.serpapi_service import SerpApiService
from dotenv import load_dotenv

load_dotenv('backend/.env')
load_dotenv('.env')

serpapi = SerpApiService()
print("Testing google_finance...")
finance_data = serpapi.get_finance_data("GOOG:NASDAQ")
if finance_data:
    if "error" in finance_data:
        print("Error:", finance_data["error"])
    else:
        print(f"Finance Data keys: {list(finance_data.keys())}")
else:
    print("Finance data returned None")

print("\nTesting google_finance_markets...")
markets_data = serpapi.get_markets_data("indexes")
if markets_data:
    if "error" in markets_data:
        print("Error:", markets_data["error"])
    else:
        print(f"Markets Data keys: {list(markets_data.keys())}")
else:
    print("Markets data returned None")


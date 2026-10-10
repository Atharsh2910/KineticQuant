from serpapi import GoogleSearch
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SerpApiService:
    def __init__(self):
        self.api_key = settings.SERP_API_KEY

    def get_finance_data(self, ticker: str):
        """
        Fetches specific asset/commodity data using google_finance engine.
        """
        try:
            params = {
                "engine": "google_finance",
                "q": ticker,
                "api_key": self.api_key
            }
            search = GoogleSearch(params)
            results = search.get_dict()
            if isinstance(results, dict) and "error" in results:
                logger.error(f"SerpApi error for {ticker}: {results['error']}")
                return None
            return results
        except Exception as e:
            logger.error(f"Exception fetching finance data for {ticker}: {str(e)}")
            return None

    def get_markets_data(self, trend: str):
        """
        Fetches macro market trends using google_finance_markets engine.
        trend e.g., 'indexes', 'sector-performance'
        """
        try:
            params = {
                "engine": "google_finance_markets",
                "trend": trend,
                "api_key": self.api_key
            }
            search = GoogleSearch(params)
            results = search.get_dict()
            if isinstance(results, dict) and "error" in results:
                logger.error(f"SerpApi error for trend {trend}: {results['error']}")
                return None
            return results
        except Exception as e:
            logger.error(f"Exception fetching markets data for {trend}: {str(e)}")
            return None


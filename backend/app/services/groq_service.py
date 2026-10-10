from groq import Groq
from app.config import settings
import logging
import json

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def analyze_sentiment(self, headlines: list[str]) -> dict:
        """
        Takes a list of market headlines and returns a sentiment multiplier and CoT explanation.
        """
        try:
            prompt = f"""
            Analyze the following market headlines and assess the impact on supply chain and SME solvency.
            Headlines:
            {headlines}
            
            Provide a JSON response exactly in this format:
            {{
                "sentiment_multiplier": <float between 0.8 and 1.2, where <1 is negative, >1 is positive, 1.0 is neutral>,
                "cot_explanation": "<chain of thought explaining the multiplier>"
            }}
            """
            
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a highly analytical AI specialized in macro-economic sentiment analysis. You respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="mixtral-8x7b-32768",
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            
            response_content = chat_completion.choices[0].message.content
            return json.loads(response_content)
        except Exception as e:
            logger.error(f"Error in Groq sentiment analysis: {str(e)}")
            # Fallback to neutral
            return {
                "sentiment_multiplier": 1.0,
                "cot_explanation": "Failed to analyze sentiment, defaulting to neutral."
            }


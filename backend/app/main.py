from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import engine, market, nlp, hedge, capital, arbitrage, discounts, passport

app = FastAPI(
    title="KineticQuant AI API",
    description="Dynamic Parametric Financing & Commerce Intelligence Platform — Full Closed-Loop Financial Copilot",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routes
app.include_router(engine.router)
app.include_router(market.router)
app.include_router(nlp.router)

# Feature routes
app.include_router(hedge.router)
app.include_router(capital.router)
app.include_router(arbitrage.router)
app.include_router(discounts.router)
app.include_router(passport.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to KineticQuant AI API v2.0",
        "features": [
            "Fuse Score Engine",
            "Market Data Sync (SerpApi)",
            "NLP Sentiment Analysis (Groq)",
            "Parametric Price Hedging",
            "Just-in-Time Capital Drawdowns",
            "Multi-Vendor Arbitrage (LangChain)",
            "AP/AR Discount Engine",
            "Dynamic Credit Passports"
        ]
    }

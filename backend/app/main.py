from fastapi import FastAPI
from app.routers import engine, market, nlp

app = FastAPI(
    title="KineticQuant AI API",
    description="Dynamic Parametric Financing & Commerce Intelligence Platform",
    version="1.0.0"
)

app.include_router(engine.router)
app.include_router(market.router)
app.include_router(nlp.router)

@app.get("/")
def root():
    return {"message": "Welcome to KineticQuant AI API"}


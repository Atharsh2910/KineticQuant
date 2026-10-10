from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import engine, market, nlp

app = FastAPI(
    title="KineticQuant AI API",
    description="Dynamic Parametric Financing & Commerce Intelligence Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(engine.router)
app.include_router(market.router)
app.include_router(nlp.router)

@app.get("/")
def root():
    return {"message": "Welcome to KineticQuant AI API"}


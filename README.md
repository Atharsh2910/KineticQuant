# KineticQuantAI
Dynamic Parametric Financing & Commerce Intelligence Platform.

## Overview
KineticQuantAI is a closed-loop financial copilot designed to autonomously manage capital, margins, and procurement for SMEs. By blending deterministic financial ledgers with predictive machine learning and agentic AI (LangChain + Groq), the platform executes real-time operational decisions. 

## Core Features
1. **Parametric Dynamic Pricing (Micro-Hedging)**: Automatically adjusts e-commerce storefront prices in real-time based on macro commodity indices to protect gross margins.
2. **Autonomous Capital Drawdowns (JIT Financing)**: Proactively monitors cash flow and executes credit line drawdowns before liquidity chokepoints occur.
3. **Agentic Multi-Vendor Inventory Arbitrage**: Uses LangChain and SerpApi to continuously evaluate global supplier pricing, dynamically re-routing procurement to maximize savings.
4. **Automated Early Payment Discount Engine**: Dynamically negotiates AR discounts to improve liquidity and AP discounts to maximize yield on idle capital.
5. **Dynamic Credit Passports**: Generates shareable, verifiable financial health badges powered by the proprietary Fuse Score, allowing SMEs to prove solvency without exposing sensitive ledgers.

## System Architecture & Workflow

### Architecture Diagram
```text
+--------------------+       +---------------------+       +-----------------------+
|  Frontend (React)  | <---> |   FastAPI Backend   | <---> |  Supabase (Postgres)  |
| - Vite, Tailwind   |       | - Service Modules   |       | - Ledgers, Passports  |
| - Recharts, UI     |       | - Routers/Endpoints |       | - Market Time Series  |
+--------------------+       +---------------------+       +-----------------------+
                                  |            |
                      +-----------v-+        +-v-------------+
                      | LangChain & |        |   SerpApi     |
                      | Groq LLMs   |        | - Google Fin. |
                      | - CoT Agent |        | - Markets     |
                      +-------------+        +---------------+
```

### System Workflow
1. **Data Ingestion:** The FastAPI backend regularly polls **SerpApi (Google Finance & Markets)** to fetch real-time commodity indices and pricing data, storing it in Supabase.
2. **Analysis & Decision:** Specific API calls activate the core service modules (e.g., `vendor_arbitrage_service.py`).
3. **Agentic Reasoning:** If a threshold is crossed (e.g., commodity price spikes > 5%), the backend calls the **Groq LLM** (via LangChain) to generate a Chain-of-Thought (CoT) strategy, determining whether to shift procurement volumes, adjust retail prices, or negotiate early AP/AR discounts.
4. **Execution:** The proposed actions are saved in Supabase with a `pending` or `proposed` status.
5. **Dashboard Presentation:** The React frontend fetches these proposals via FastAPI. The SME owner reviews the AI's reasoning and approves the action with a single click.

## Tech Stack
* **Market Intelligence API**: **SerpApi** (Google Finance, Google Finance Markets)
* **Backend**: FastAPI, Python, PyTorch (LSTM), Statsmodels (SARIMAX)
* **AI/Agents**: LangChain, Groq
* **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts
* **Database**: Supabase (PostgreSQL)

## Getting Started(Local Setup)

### Prerequisites
* Python 3.10+
* Node.js 18+
* Supabase Account
* Groq API Key
* **SerpApi API Key**

### Backend Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate the environment: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. Install dependencies: `pip install -r requirements.txt`
4. Set up your `.env` file in the root directory and ensure `SERP_API_KEY` is added.
5. Run the backend server: `cd backend && uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set up the `frontend/.env` file.
4. Run the development server: `npm run dev`
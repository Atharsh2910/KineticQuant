import torch
import torch.nn as nn
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import logging
import os
import pickle

logger = logging.getLogger(__name__)

class TabularPredictiveModel(nn.Module):
    def __init__(self, input_dim=10, hidden_dim=64, output_dim=1):
        super(TabularPredictiveModel, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, output_dim)
        )
        
    def forward(self, x):
        return self.network(x)

class PredictiveEngine:
    def __init__(self):
        self.model = TabularPredictiveModel(input_dim=10)
        # Find project root (3 levels up from this file)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.model_path = os.path.join(base_dir, 'models', 'tabular_model.pt')
        self.scaler_path = os.path.join(base_dir, 'models', 'feature_scalers.pkl')
        self.sarimax_path = os.path.join(base_dir, 'models', 'sarimax_model.pkl')
        
        self.scalers = None
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model.load_state_dict(torch.load(self.model_path, weights_only=True))
            with open(self.scaler_path, 'rb') as f:
                self.scalers = pickle.load(f)
            logger.info("Loaded pre-trained TabularPredictiveModel.")
        else:
            logger.warning("Pre-trained tabular model or scalers not found. Using untrained weights.")
            
        self.model.eval() # inference only
        
        self.sarimax_results = None
        if os.path.exists(self.sarimax_path):
            with open(self.sarimax_path, 'rb') as f:
                self.sarimax_results = pickle.load(f)
            logger.info("Loaded pre-trained SARIMAX model.")
        else:
            logger.warning("Pre-trained SARIMAX model not found. Will fit on the fly.")

    def calculate_delta(self, transaction_history: list[float], macro_data: list[float], ledger: dict = None, base_score: float = 50.0) -> dict:
        """
        Calculates volatility delta using TabularPredictiveModel and SARIMAX.
        """
        tabular_delta = 0.0
        sarimax_delta = 0.0
        cot_parts = []
        
        # Tabular Prediction for transaction anomalies
        if ledger is None:
            ledger = {}
            
        cash = float(ledger.get("cash_on_hand", 0))
        ar = float(ledger.get("accounts_receivable", 0))
        ap = float(ledger.get("accounts_payable", 0))
        inventory_costs = float(ledger.get("inventory_holding_costs", 0))
        
        # Approximate missing features
        monthly_revenue = cash * 0.5
        production_latency_days = 15.0
        inventory_turnover = 4.0
        
        commodity_price_var_pct = 0.0
        if len(macro_data) >= 2:
            commodity_price_var_pct = (macro_data[-1] - macro_data[0]) / (macro_data[0] + 1e-5)
            
        fx_volatility_index = 1.2
        freight_cost_var_pct = 0.05
        
        features = np.array([
            monthly_revenue, cash, ar, ap, 
            production_latency_days, inventory_turnover, commodity_price_var_pct, 
            fx_volatility_index, freight_cost_var_pct, base_score
        ], dtype=np.float32)
        
        if self.scalers:
            mean = self.scalers['mean']
            std = self.scalers['std']
            features = (features - mean) / (std + 1e-8)
            
        with torch.no_grad():
            tensor_features = torch.FloatTensor(features).unsqueeze(0)
            pred = self.model(tensor_features).item()
            tabular_delta = max(min(pred, 15), -15) # cap between -15 and 15
            cot_parts.append(f"Deep Learning model predicted delta of {tabular_delta:.2f}.")

        # SARIMAX for macro trend
        if len(macro_data) >= 10:
            try:
                if self.sarimax_results is not None:
                    # Apply pre-trained model to new data
                    updated_results = self.sarimax_results.apply(macro_data)
                    forecast = updated_results.forecast(steps=1)[0]
                else:
                    # Fallback to fitting on the fly
                    model = SARIMAX(macro_data, order=(1, 1, 1), seasonal_order=(0,0,0,0))
                    results = model.fit(disp=False)
                    forecast = results.forecast(steps=1)[0]
                
                # If macro data (e.g., costs) are forecasted to go up, negative impact
                recent_val = macro_data[-1]
                change = (forecast - recent_val) / (recent_val + 1e-5)
                sarimax_delta = -1 * max(min(change * 20, 15), -15) # inverse relationship if cost
                
                cot_parts.append(f"SARIMAX forecasted macro index change of {change*100:.2f}%, adding {sarimax_delta:.2f} to delta.")
            except Exception as e:
                logger.error(f"SARIMAX error: {e}")
                cot_parts.append(f"SARIMAX model failed: {e}")
        else:
            cot_parts.append("Not enough macro data for SARIMAX.")
            
        total_delta = tabular_delta + sarimax_delta
        
        return {
            "delta_score": total_delta,
            "cot_explanation": " | ".join(cot_parts)
        }


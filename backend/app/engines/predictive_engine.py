import torch
import torch.nn as nn
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import logging

logger = logging.getLogger(__name__)

class SimpleLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_layer_size=10, output_size=1):
        super().__init__()
        self.hidden_layer_size = hidden_layer_size
        self.lstm = nn.LSTM(input_size, hidden_layer_size)
        self.linear = nn.Linear(hidden_layer_size, output_size)
        
    def forward(self, input_seq):
        lstm_out, _ = self.lstm(input_seq.view(len(input_seq), 1, -1))
        predictions = self.linear(lstm_out.view(len(input_seq), -1))
        return predictions[-1]

import os
import pickle

class PredictiveEngine:
    def __init__(self):
        self.lstm_model = SimpleLSTM()
        # Find project root (3 levels up from this file)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.lstm_path = os.path.join(base_dir, 'models', 'lstm_model.pt')
        self.sarimax_path = os.path.join(base_dir, 'models', 'sarimax_model.pkl')
        
        if os.path.exists(self.lstm_path):
            self.lstm_model.load_state_dict(torch.load(self.lstm_path, weights_only=True))
            logger.info("Loaded pre-trained LSTM model.")
        else:
            logger.warning("Pre-trained LSTM model not found. Using untrained weights.")
            
        self.lstm_model.eval() # inference only
        
        self.sarimax_results = None
        if os.path.exists(self.sarimax_path):
            with open(self.sarimax_path, 'rb') as f:
                self.sarimax_results = pickle.load(f)
            logger.info("Loaded pre-trained SARIMAX model.")
        else:
            logger.warning("Pre-trained SARIMAX model not found. Will fit on the fly.")

    def calculate_delta(self, transaction_history: list[float], macro_data: list[float]) -> dict:
        """
        Calculates volatility delta using LSTM and SARIMAX.
        """
        lstm_delta = 0.0
        sarimax_delta = 0.0
        cot_parts = []
        
        # LSTM Prediction for transaction anomalies
        if len(transaction_history) >= 5:
            with torch.no_grad():
                seq = torch.FloatTensor(transaction_history[-5:])
                pred = self.lstm_model(seq).item()
                # Simple logic: if prediction is lower than average, negative delta
                avg = np.mean(transaction_history)
                variance = (pred - avg) / (avg + 1e-5)
                lstm_delta = max(min(variance * 10, 10), -10) # cap between -10 and 10
                cot_parts.append(f"LSTM predicted transaction volume variance of {variance*100:.2f}%, adding {lstm_delta:.2f} to delta.")
        else:
            cot_parts.append("Not enough transaction history for LSTM.")

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
            
        total_delta = lstm_delta + sarimax_delta
        
        return {
            "delta_score": total_delta,
            "cot_explanation": " | ".join(cot_parts)
        }


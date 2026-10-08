import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from statsmodels.tsa.statespace.sarimax import SARIMAX
import pickle
import os

# ==========================================
# 1. PyTorch Tabular Model Architecture
# ==========================================
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

class SMEDataset(Dataset):
    def __init__(self, csv_file):
        df = pd.read_csv(csv_file)
        
        # Select Features
        self.features = df[[
            'monthly_revenue', 'cash_on_hand', 'accounts_receivable', 'accounts_payable', 
            'production_latency_days', 'inventory_turnover', 'commodity_price_var_pct', 
            'fx_volatility_index', 'freight_cost_var_pct', 'base_deterministic_score'
        ]].values
        
        # Select Target (Predictive Delta)
        self.targets = df['predictive_delta'].values
        
        # Normalize features
        self.mean = np.mean(self.features, axis=0)
        self.std = np.std(self.features, axis=0)
        self.features = (self.features - self.mean) / (self.std + 1e-8)
        
    def __len__(self):
        return len(self.targets)
    
    def __getitem__(self, idx):
        x = torch.tensor(self.features[idx], dtype=torch.float32)
        y = torch.tensor(self.targets[idx], dtype=torch.float32)
        return x, y
    
    def get_scalers(self):
        return {'mean': self.mean, 'std': self.std}

def train_pytorch_model(data_path, save_path, scaler_save_path):
    print("Initializing PyTorch Training...")
    dataset = SMEDataset(data_path)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    model = TabularPredictiveModel(input_dim=10)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 50
    for epoch in range(epochs):
        epoch_loss = 0.0
        for batch_x, batch_y in dataloader:
            optimizer.zero_grad()
            predictions = model(batch_x).squeeze()
            loss = criterion(predictions, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
            
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{epochs} | Loss: {epoch_loss/len(dataloader):.4f}")
            
    # Save Model Weights
    torch.save(model.state_dict(), save_path)
    # Save Scalers
    with open(scaler_save_path, 'wb') as f:
        pickle.dump(dataset.get_scalers(), f)
        
    print(f"✅ PyTorch Model saved to {save_path}")
    print(f"✅ Feature Scalers saved to {scaler_save_path}")

# ==========================================
# 2. Statsmodels SARIMAX Architecture
# ==========================================
def train_sarimax(data_path, save_path):
    print("\nInitializing SARIMAX Training...")
    df = pd.read_csv(data_path)
    
    # Sort by timestamp to ensure proper time-series flow
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    
    # Isolate a specific dominant commodity (e.g., COTTON) for the baseline macro model
    cotton_df = df[df['ticker'] == 'COTTON'].copy()
    
    if len(cotton_df) == 0:
        print("Warning: COTTON ticker not found, falling back to aggregate price.")
        cotton_df = df.copy()
        
    ts_data = cotton_df['price'].values
    
    # Fit SARIMAX (Order 1,1,1 is standard for smoothing non-stationary financial data)
    model = SARIMAX(ts_data, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0))
    results = model.fit(disp=False)
    
    # Save the fitted model
    with open(save_path, 'wb') as f:
        pickle.dump(results, f)
        
    print(f"✅ SARIMAX Model saved to {save_path}")

if __name__ == "__main__":
    os.makedirs('models', exist_ok=True)
    
    # Paths
    training_data_path = 'data/sme_parametric_financing_training.csv'
    market_data_path = 'data/market_time_series.csv'
    
    pt_save_path = 'models/tabular_model.pt'
    scaler_save_path = 'models/feature_scalers.pkl'
    pkl_save_path = 'models/sarimax_model.pkl'
    
    train_pytorch_model(training_data_path, pt_save_path, scaler_save_path)
    train_sarimax(market_data_path, pkl_save_path)
    
    print("\n🎉 Training Pipeline Complete! You can now load these .pt and .pkl files in the FastAPI engine.")

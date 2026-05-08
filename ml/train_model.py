import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
from utils import get_data_path, get_model_path

def train():
    print("Loading engineered data...")
    input_path = get_data_path('engineered_data.csv')
    df = pd.read_csv(input_path, parse_dates=['date'])
    
    # Define features and target
    # Excluded: date, festival_name, surge_risk (which is derived from actual_patients)
    features = [
        'humidity', 'temperature', 'rainfall', 'festival', 
        'respiratory_alert', 'baseline_patients', 'day_of_week', 
        'month', 'is_weekend', 'humidity_drop', 'days_until_festival', 
        'rolling_patient_average', 'humidity_delta', 'rainfall_intensity', 
        'monday_adjacent', 'seasonal_index'
    ]
    
    target = 'actual_patients'
    
    # Sort by date to maintain temporal structure for validation
    df = df.sort_values('date')
    
    X = df[features]
    y = df[target]
    
    # 80/20 train/test split. Shuffle=False to avoid data leakage from future to past
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # Initialize XGBoost Regressor
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        objective='reg:squarederror'
    )
    
    # Train
    model.fit(X_train, y_train)
    
    # Predict
    y_pred = model.predict(X_test)
    
    # Evaluate
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Evaluation ---")
    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²:   {r2:.4f}")
    print("------------------------")
    
    # Save model
    model_path = get_model_path('xgboost_model.pkl')
    joblib.dump(model, model_path)
    print(f"\nModel successfully saved to {model_path}")
    
    # Feature importance
    importance = pd.DataFrame({
        'Feature': features,
        'Importance': model.feature_importances_
    }).sort_values(by='Importance', ascending=False)
    
    print("\nTop 5 Features by Weight:")
    print(importance.head().to_string(index=False))

if __name__ == "__main__":
    train()

import json
import datetime
import pandas as pd
import numpy as np
import joblib
import shap
from utils import get_data_path, get_model_path, get_output_path

# Human readable mapping for SHAP features to make it frontend/user-friendly
SHAP_HUMAN_MAPPING = {
    'festival': 'Festival travel window',
    'respiratory_alert': 'IDSP respiratory alert',
    'humidity_drop': 'Humidity drop >15%',
    'rainfall': 'Heavy rainfall activity',
    'is_weekend': 'Weekend accident/travel pattern',
    'days_until_festival': 'Approaching festival surge',
    'monday_adjacent': 'Post-weekend/Pre-weekend hospital load',
    'rainfall_intensity': 'Intensity of recent rains',
    'humidity_delta': 'Sudden humidity shift',
    'seasonal_index': 'High-risk monsoon/winter season',
    'temperature': 'Unfavorable temperature conditions',
    'humidity': 'High baseline humidity',
    'rolling_patient_average': 'Recent high hospital volume'
}

def humanize_shap_feature(feature_name):
    """Converts a technical feature name to a human-readable explanation."""
    return SHAP_HUMAN_MAPPING.get(feature_name, feature_name.replace('_', ' ').capitalize())

def generate_forecast():
    print("Loading trained model and recent data...")
    # Load model
    model_path = get_model_path('xgboost_model.pkl')
    try:
        model = joblib.load(model_path)
    except FileNotFoundError:
        print("Model not found. Please run train_model.py first.")
        return
    
    # Load data
    data_path = get_data_path('engineered_data.csv')
    df = pd.read_csv(data_path, parse_dates=['date'])
    df = df.sort_values('date')
    
    # For a hackathon demo, we take the last 7 days of the dataset as our "future forecast period"
    forecast_df = df.tail(7).copy()
    
    features = [
        'humidity', 'temperature', 'rainfall', 'festival', 
        'respiratory_alert', 'baseline_patients', 'day_of_week', 
        'month', 'is_weekend', 'humidity_drop', 'days_until_festival', 
        'rolling_patient_average', 'humidity_delta', 'rainfall_intensity', 
        'monday_adjacent', 'seasonal_index'
    ]
    
    X_forecast = forecast_df[features]
    
    # Predict future patient volumes
    predictions = model.predict(X_forecast)
    forecast_df['predicted_patients'] = np.round(predictions).astype(int)
    
    # Run SHAP to explain the predictions
    print("Generating SHAP explanations...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_forecast)
    
    forecast_output = []
    
    # Build the JSON structure required by the frontend
    for i, (_, row) in enumerate(forecast_df.iterrows()):
        date_str = row['date'].strftime('%Y-%m-%d')
        day_label = row['date'].strftime('%A')
        
        pred_vol = int(row['predicted_patients'])
        base_vol = int(row['baseline_patients'])
        
        # Calculate a realistic surge probability (0.0 to 1.0)
        ratio = pred_vol / max(1, base_vol)
        surge_prob = min(0.95, max(0.05, (ratio - 1.0) * 1.5)) # Adjust heuristic multiplier
        
        # Assign categorical risk levels
        if ratio > 1.3:
            risk_level = "HIGH"
        elif ratio > 1.15:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        # Extract the top positive SHAP factors driving the surge
        day_shap_vals = shap_values[i]
        
        # Sort indices by value descending to get highest positive impact features
        top_indices = np.argsort(day_shap_vals)[::-1]
        
        shap_factors = []
        for idx in top_indices:
            val = day_shap_vals[idx]
            # Only include factors that meaningfully pushed the patient count up
            if val > 2: 
                feat_name = features[idx]
                shap_factors.append({
                    "label": humanize_shap_feature(feat_name),
                    "value": round(float(val), 2)
                })
            # Limit to top 3 factors for frontend clarity
            if len(shap_factors) >= 3:
                break
                
        # Fallback if no specific factors are driving a surge
        if not shap_factors:
            shap_factors.append({
                "label": "Normal seasonal baseline",
                "value": round(float(day_shap_vals[top_indices[0]]), 2)
            })
            
        forecast_output.append({
            "date": date_str,
            "day_label": day_label,
            "predicted_volume": pred_vol,
            "baseline_volume": base_vol,
            "surge_probability": round(float(surge_prob), 2),
            "risk_level": risk_level,
            "shap_factors": shap_factors
        })
        
    # Construct final JSON payload
    has_high_risk = any(f['risk_level'] == 'HIGH' for f in forecast_output)
    
    final_json = {
        "hospital": "Shivamogga District Hospital",
        "generated_at": datetime.datetime.now().isoformat() + "Z",
        "forecast": forecast_output,
        "departments": [
            {
                "name": "Emergency",
                "risk_level": "HIGH" if has_high_risk else "MEDIUM"
            },
            {
                "name": "General Ward",
                "risk_level": "MEDIUM"
            }
        ]
    }
    
    # Save the output to a file
    output_path = get_output_path('forecast_output.json')
    with open(output_path, 'w') as f:
        json.dump(final_json, f, indent=2)
        
    print(f"\nForecast JSON successfully generated and saved to {output_path}")

if __name__ == "__main__":
    generate_forecast()

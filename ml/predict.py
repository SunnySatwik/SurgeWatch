"""
SurgeWatch Live Prediction Script

Lightweight prediction-only script. Loads the trained model and outputs
predictions from a JSON feature vector. No training, no SHAP.

Usage:
    echo '{"humidity":72,"temperature":28,...}' | python predict.py
    python predict.py --features '{"humidity":72,"temperature":28,...}'
"""

import sys
import json
import joblib
import numpy as np
from utils import get_model_path

FEATURE_ORDER = [
    'humidity', 'temperature', 'rainfall', 'festival',
    'respiratory_alert', 'baseline_patients', 'day_of_week',
    'month', 'is_weekend', 'humidity_drop', 'days_until_festival',
    'rolling_patient_average', 'humidity_delta', 'rainfall_intensity',
    'monday_adjacent', 'seasonal_index'
]

# Sensible defaults for missing features
FEATURE_DEFAULTS = {
    'humidity': 65,
    'temperature': 28,
    'rainfall': 0,
    'festival': 0,
    'respiratory_alert': 0,
    'baseline_patients': 110,
    'day_of_week': 2,
    'month': 5,
    'is_weekend': 0,
    'humidity_drop': 0,
    'days_until_festival': 30,
    'rolling_patient_average': 110,
    'humidity_delta': 0,
    'rainfall_intensity': 0,
    'monday_adjacent': 0,
    'seasonal_index': 0.3
}


def load_model():
    """Load the trained XGBoost model."""
    model_path = get_model_path('xgboost_model.pkl')
    try:
        return joblib.load(model_path)
    except FileNotFoundError:
        print(json.dumps({"error": "Model not found. Run train_model.py first."}))
        sys.exit(1)


def build_feature_vector(features_dict):
    """Build a numpy array in the correct feature order, filling defaults for missing."""
    vector = []
    for feat in FEATURE_ORDER:
        value = features_dict.get(feat, FEATURE_DEFAULTS.get(feat, 0))
        try:
            vector.append(float(value))
        except (ValueError, TypeError):
            vector.append(float(FEATURE_DEFAULTS.get(feat, 0)))
    return np.array([vector])


def predict(features_dict):
    """Run prediction and return result as dict."""
    model = load_model()
    X = build_feature_vector(features_dict)
    prediction = model.predict(X)[0]
    predicted_volume = int(round(prediction))
    
    # Calculate risk level
    baseline = features_dict.get('baseline_patients', 110)
    ratio = predicted_volume / max(1, baseline)
    
    if ratio > 1.3:
        risk_level = "HIGH"
    elif ratio > 1.15:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    surge_probability = min(0.95, max(0.05, (ratio - 1.0) * 1.5))
    
    return {
        "predicted_volume": predicted_volume,
        "baseline_volume": int(baseline),
        "risk_level": risk_level,
        "surge_probability": round(surge_probability, 3),
        "ratio": round(ratio, 3)
    }


if __name__ == "__main__":
    # Read features from --features arg or stdin
    features_json = None
    
    if '--features' in sys.argv:
        idx = sys.argv.index('--features')
        if idx + 1 < len(sys.argv):
            features_json = sys.argv[idx + 1]
    
    if not features_json:
        # Try reading from stdin
        if not sys.stdin.isatty():
            features_json = sys.stdin.read().strip()
    
    if not features_json:
        # Use defaults for demo
        features_json = json.dumps(FEATURE_DEFAULTS)
    
    try:
        features = json.loads(features_json)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
        sys.exit(1)
    
    result = predict(features)
    print(json.dumps(result))

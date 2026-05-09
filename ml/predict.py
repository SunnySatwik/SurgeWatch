"""
SurgeWatch Live Prediction Script

Lightweight prediction-only script. Loads the trained classifier and outputs
predictions from a JSON feature vector. No training, no SHAP.

Usage:
    echo '{"humidity":72,"temperature":28,...}' | python predict.py
    python predict.py --features '{"humidity":72,"temperature":28,...}'
"""

import sys
import json
import joblib
import numpy as np
import os
from utils import get_model_path

def load_assets():
    """Load the trained model, feature order, and class mapping."""
    try:
        model = joblib.load(get_model_path('surge_classifier_model.pkl'))
        with open(get_model_path('model_features.json'), 'r') as f:
            features = json.load(f)
        classes = np.load(get_model_path('label_encoder_classes.npy'))
        return model, features, classes
    except FileNotFoundError as e:
        print(json.dumps({"error": f"Model assets not found: {str(e)}"}))
        sys.exit(1)

def build_feature_vector(features_dict, feature_order):
    """Build a numpy array in the correct feature order, filling defaults for missing."""
    vector = []
    for feat in feature_order:
        value = features_dict.get(feat, 0)
        try:
            vector.append(float(value))
        except (ValueError, TypeError):
            vector.append(0.0)
    return np.array([vector])

def predict(features_dict):
    """Run prediction and return result as dict."""
    model, feature_order, classes = load_assets()
    
    X = build_feature_vector(features_dict, feature_order)
    
    # Get probabilities
    if hasattr(model, 'predict_proba'):
        probs = model.predict_proba(X)[0]
    else:
        # Fallback if no probabilities (shouldn't happen with XGBoost/RF)
        pred_idx = model.predict(X)[0]
        probs = np.zeros(len(classes))
        probs[pred_idx] = 1.0
        
    # Get highest probability class
    pred_idx = np.argmax(probs)
    risk_level = classes[pred_idx]
    
    # Calculate confidence / surge probability
    # 'surge probability' could be represented as probability of HIGH or CRITICAL
    high_idx = np.where(classes == 'HIGH')[0][0] if 'HIGH' in classes else 2
    crit_idx = np.where(classes == 'CRITICAL')[0][0] if 'CRITICAL' in classes else 3
    
    surge_probability = float(probs[high_idx] + probs[crit_idx])
    
    return {
        "risk_level": str(risk_level),
        "surge_probability": round(surge_probability, 3),
        "confidence": round(float(probs[pred_idx]), 3),
        "class_probabilities": {str(c): round(float(p), 3) for c, p in zip(classes, probs)}
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
        print(json.dumps({"error": "No features provided"}))
        sys.exit(1)
        
    try:
        features = json.loads(features_json)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
        sys.exit(1)
    
    result = predict(features)
    print(json.dumps(result))

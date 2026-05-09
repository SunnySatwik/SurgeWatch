"""
SurgeWatch Model Training Pipeline
Trains multiple classification models to predict 'surge_risk'.
Uses TimeSeriesSplit to prevent leakage and handles class imbalance.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import lightgbm as lgb
from utils import get_data_path, get_model_path, get_output_path

def train_and_compare():
    print("Loading engineered data for classification...")
    input_path = get_data_path('engineered_data.csv')
    df = pd.read_csv(input_path, parse_dates=['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # Feature Selection
    features = [
        'day_of_week', 'month', 'is_weekend', 'week_of_year', 'quarter',
        'flu_season', 'monsoon_season', 'monday_adjacent',
        'temperature', 'humidity', 'rainfall', 'humidity_drop',
        'festival', 'days_until_festival', 'respiratory_alert',
        'patients_prev_day', 'patients_3day_avg', 'patients_7day_avg',
        'patient_growth_rate', 'rolling_std_patients',
        'rainfall_prev_day', 'cumulative_rainfall_3day', 'humidity_trend',
        'estimated_bed_occupancy', 'emergency_load_index', 'staff_pressure_index'
    ]
    target = 'surge_risk'
    
    X = df[features]
    y = df[target]
    
    # Encode target labels
    le = LabelEncoder()
    # Ensure specific ordering for classes (LOW=0, MEDIUM=1, HIGH=2, CRITICAL=3)
    # We will map explicitly
    class_mapping = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3}
    y_encoded = y.map(class_mapping)
    
    # Save encoder mapping
    np.save(get_model_path('label_encoder_classes.npy'), np.array(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']))
    
    # Time Series Split for temporal validation
    tscv = TimeSeriesSplit(n_splits=5)
    
    # Define models
    models = {
        'RandomForest': RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42),
        'XGBoost': xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, objective='multi:softprob', random_state=42),
        'LightGBM': lgb.LGBMClassifier(n_estimators=100, class_weight='balanced', random_state=42, verbose=-1)
    }
    
    results = {name: {'accuracy': [], 'f1_macro': [], 'precision': [], 'recall': []} for name in models.keys()}
    
    print("\nEvaluating models via TimeSeriesSplit...")
    for train_idx, val_idx in tscv.split(X):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y_encoded.iloc[train_idx], y_encoded.iloc[val_idx]
        
        # Compute sample weights for XGBoost manually since it doesn't have class_weight='balanced'
        classes = np.unique(y_train)
        weights = len(y_train) / (len(classes) * np.bincount(y_train))
        sample_weights = np.array([weights[yi] for yi in y_train])
        
        for name, model in models.items():
            if name == 'XGBoost':
                model.fit(X_train, y_train, sample_weight=sample_weights)
            else:
                model.fit(X_train, y_train)
                
            preds = model.predict(X_val)
            
            results[name]['accuracy'].append(accuracy_score(y_val, preds))
            results[name]['f1_macro'].append(f1_score(y_val, preds, average='macro', zero_division=0))
            results[name]['precision'].append(precision_score(y_val, preds, average='macro', zero_division=0))
            results[name]['recall'].append(recall_score(y_val, preds, average='macro', zero_division=0))
            
    # Calculate means
    print("\n--- Model Comparison (Cross-Validation Means) ---")
    best_model_name = None
    best_f1 = -1
    
    for name in models.keys():
        acc = np.mean(results[name]['accuracy'])
        f1 = np.mean(results[name]['f1_macro'])
        prec = np.mean(results[name]['precision'])
        rec = np.mean(results[name]['recall'])
        
        print(f"{name}:")
        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1-Macro:  {f1:.4f}\n")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            
    print(f"Best model based on F1-Macro: {best_model_name}")
    
    # Train best model on FULL dataset
    print(f"\nTraining {best_model_name} on the full dataset...")
    best_model = models[best_model_name]
    
    if best_model_name == 'XGBoost':
        classes = np.unique(y_encoded)
        weights = len(y_encoded) / (len(classes) * np.bincount(y_encoded))
        full_sample_weights = np.array([weights[yi] for yi in y_encoded])
        best_model.fit(X, y_encoded, sample_weight=full_sample_weights)
    else:
        best_model.fit(X, y_encoded)
        
    # Save the best model
    model_path = get_model_path('surge_classifier_model.pkl')
    joblib.dump(best_model, model_path)
    print(f"Model successfully saved to {model_path}")
    
    # Save features list
    import json
    with open(get_model_path('model_features.json'), 'w') as f:
        json.dump(features, f)

if __name__ == "__main__":
    train_and_compare()

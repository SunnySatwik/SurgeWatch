"""
SurgeWatch Model Retraining Script

Periodic retraining wrapper that:
1. Regenerates synthetic data (or would pull from DB in production)
2. Runs feature engineering
3. Retrains the XGBoost model
4. Saves the new model with a timestamp
5. Logs model metrics for comparison

Usage:
    python retrain_model.py
    python retrain_model.py --force   # Force retrain even if recent model exists

This runs MANUALLY or on a SCHEDULE — never during live operations.
"""

import sys
import os
import datetime
import json
import shutil
from utils import get_model_path, get_data_path, get_output_path

def retrain(force=False):
    model_path = get_model_path('xgboost_model.pkl')
    
    # Check if recent model exists (skip if retrained within last hour, unless forced)
    if os.path.exists(model_path) and not force:
        mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(model_path))
        age_hours = (datetime.datetime.now() - mod_time).total_seconds() / 3600
        if age_hours < 1:
            print(f"Model was retrained {age_hours:.1f} hours ago. Use --force to override.")
            return
    
    print("=" * 50)
    print("SurgeWatch Model Retraining Pipeline")
    print(f"Started at: {datetime.datetime.now().isoformat()}")
    print("=" * 50)
    
    # Step 1: Generate fresh synthetic data
    print("\n[1/4] Generating fresh training data...")
    from generate_dataset import generate_hospital_data
    generate_hospital_data()
    
    # Step 2: Run feature engineering
    print("\n[2/4] Running feature engineering...")
    from feature_engineering import engineer_features
    engineer_features()
    
    # Step 3: Backup old model
    if os.path.exists(model_path):
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = get_model_path(f'xgboost_model_backup_{timestamp}.pkl')
        shutil.copy2(model_path, backup_path)
        print(f"\n[*] Old model backed up to: {backup_path}")
    
    # Step 4: Retrain
    print("\n[3/4] Training new model...")
    from train_model import train
    train()
    
    # Step 5: Generate fresh forecast
    print("\n[4/4] Generating fresh forecast...")
    from generate_forecast import generate_forecast
    generate_forecast()
    
    # Log retraining event
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "model_path": model_path,
        "status": "success"
    }
    
    log_path = get_model_path('retrain_log.json')
    logs = []
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            logs = json.load(f)
    logs.append(log_entry)
    with open(log_path, 'w') as f:
        json.dump(logs, f, indent=2)
    
    print("\n" + "=" * 50)
    print("Retraining complete!")
    print(f"Finished at: {datetime.datetime.now().isoformat()}")
    print("=" * 50)


if __name__ == "__main__":
    force = '--force' in sys.argv
    retrain(force=force)

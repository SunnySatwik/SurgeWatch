"""
SurgeWatch Model Evaluation & Explainability
Evaluates the trained model on the latest data and generates SHAP explanations.
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import shap
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from utils import get_data_path, get_model_path, get_output_path

def evaluate_and_explain():
    print("Loading model and data for evaluation...")
    
    # Setup output dirs
    eval_dir = get_output_path('evaluation')
    os.makedirs(eval_dir, exist_ok=True)
    
    # Load model and features
    model_path = get_model_path('surge_classifier_model.pkl')
    if not os.path.exists(model_path):
        print("Model not found. Run train_model.py first.")
        return
        
    model = joblib.load(model_path)
    
    with open(get_model_path('model_features.json'), 'r') as f:
        features = json.load(f)
        
    class_mapping = np.load(get_model_path('label_encoder_classes.npy'))
    
    # Load data
    df = pd.read_csv(get_data_path('engineered_data.csv'), parse_dates=['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # We evaluate on the last 20% of time (the "future")
    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:]
    
    X_test = test_df[features]
    y_test_raw = test_df['surge_risk']
    
    # Map test labels
    mapping_dict = {name: i for i, name in enumerate(class_mapping)}
    y_test = y_test_raw.map(mapping_dict)
    
    # Predict
    y_pred = model.predict(X_test)
    
    # 1. Classification Report & Confusion Matrix
    print("\n--- Final Test Set Evaluation ---")
    print(classification_report(y_test, y_pred, target_names=class_mapping, zero_division=0))
    
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_mapping, yticklabels=class_mapping)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(eval_dir, 'confusion_matrix.png'), dpi=300)
    plt.close()
    
    # 2. Global Feature Importance (Tree-based)
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        imp_df = pd.DataFrame({'Feature': features, 'Importance': importances})
        imp_df = imp_df.sort_values(by='Importance', ascending=False)
        
        # Save to JSON for backend usage
        imp_dict = imp_df.set_index('Feature').to_dict()['Importance']
        with open(os.path.join(eval_dir, 'feature_importance.json'), 'w') as f:
            json.dump(imp_dict, f, indent=2)
            
        # Plot top 15
        plt.figure(figsize=(10, 8))
        sns.barplot(data=imp_df.head(15), x='Importance', y='Feature', palette='viridis')
        plt.title('Top 15 Most Important Features')
        plt.tight_layout()
        plt.savefig(os.path.join(eval_dir, 'feature_importance.png'), dpi=300)
        plt.close()
        
    # 3. SHAP Explainability
    print("\nGenerating SHAP explanations (this may take a moment)...")
    
    # Use TreeExplainer for Tree models
    explainer = shap.TreeExplainer(model)
    # SHAP calculates for all classes in multi-class classification
    # For speed, we just explain a sample of the test set
    X_sample = shap.sample(X_test, 100)
    shap_values = explainer.shap_values(X_sample)
    
    # Plot SHAP summary (For multi-class, shap_values is a list of arrays)
    plt.figure(figsize=(12, 8))
    shap.summary_plot(shap_values, X_sample, class_names=class_mapping, show=False)
    plt.tight_layout()
    plt.savefig(os.path.join(eval_dir, 'shap_summary.png'), dpi=300)
    plt.close()
    
    print(f"\nEvaluation complete! All reports and plots saved to {eval_dir}/")

if __name__ == "__main__":
    evaluate_and_explain()

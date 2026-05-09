"""
SurgeWatch Feature Engineering
Takes raw hospital data and creates advanced temporal, lag, rolling,
and environmental features. Also implements probabilistic target logic (surge_risk).
"""

import pandas as pd
import numpy as np
import os
from utils import get_data_path

def engineer_features():
    """Reads raw data, engineers advanced features, and assigns probabilistic labels."""
    print("Running advanced feature engineering...")
    
    input_path = get_data_path('raw_hospital_data.csv')
    df = pd.read_csv(input_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # 1. Temporal Features
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    df['quarter'] = df['date'].dt.quarter
    df['flu_season'] = df['month'].isin([11, 12, 1, 2]).astype(int)
    df['monsoon_season'] = df['month'].isin([6, 7, 8, 9]).astype(int)
    df['monday_adjacent'] = df['day_of_week'].isin([0, 1, 5, 6]).astype(int) # Friday-Monday

    # 2. Lag and Rolling Trend Features (Target: actual_patients)
    # Shift by 1 to prevent data leakage (we only know up to yesterday when predicting today)
    df['patients_prev_day'] = df['actual_patients'].shift(1).fillna(df['baseline_patients'])
    
    # Rolling averages over the past 3 and 7 days (exclusive of today)
    df['patients_3day_avg'] = df['actual_patients'].shift(1).rolling(window=3, min_periods=1).mean().fillna(df['baseline_patients'])
    df['patients_7day_avg'] = df['actual_patients'].shift(1).rolling(window=7, min_periods=1).mean().fillna(df['baseline_patients'])
    
    # Growth rate (compared to 7 day average)
    df['patient_growth_rate'] = (df['patients_prev_day'] - df['patients_7day_avg']) / df['patients_7day_avg']
    df['patient_growth_rate'] = df['patient_growth_rate'].fillna(0)
    
    # Rolling standard deviation (volatility proxy)
    df['rolling_std_patients'] = df['actual_patients'].shift(1).rolling(window=7, min_periods=1).std().fillna(0)

    # 3. Environmental Rolling Features
    df['rainfall_prev_day'] = df['rainfall'].shift(1).fillna(0)
    df['cumulative_rainfall_3day'] = df['rainfall'].rolling(window=3, min_periods=1).sum()
    df['humidity_trend'] = df['humidity'] - df['humidity'].shift(3).fillna(df['humidity'])
    df['days_until_festival'] = calculate_days_until_festival(df)

    # 4. Operational Proxies
    # Proxy: Higher 3-day average implies higher base occupancy today
    df['estimated_bed_occupancy'] = np.clip((df['patients_3day_avg'] / 150) * 100, 40, 100) # Assuming 150 is "full" capacity
    
    # Emergency Load Index: high patient influx on weekends indicates high emergency
    df['emergency_load_index'] = df['patient_growth_rate'] * df['is_weekend'] * 10
    
    # Staff Pressure Index: High occupancy + weekend + high volatility
    df['staff_pressure_index'] = (df['estimated_bed_occupancy'] / 100) * (1 + df['is_weekend']) * (1 + df['rolling_std_patients'] / 20)

    # 5. Probabilistic Target Logic (surge_risk)
    # We create a hidden "pressure score" based on the features, then map to probabilities
    df['surge_risk'] = generate_probabilistic_labels(df)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(get_data_path('engineered_data.csv')), exist_ok=True)
    
    output_path = get_data_path('engineered_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Feature engineering complete. Engineered dataset saved at {output_path}")

def calculate_days_until_festival(df):
    """Calculates days until the next festival for each row."""
    festival_dates = df[df['festival'] == 1]['date'].tolist()
    days_until = []
    
    for current_date in df['date']:
        future_fests = [d for d in festival_dates if d >= current_date]
        if future_fests:
            days = (min(future_fests) - current_date).days
            days_until.append(min(days, 30)) # Cap at 30 days
        else:
            days_until.append(30)
            
    return days_until

def generate_probabilistic_labels(df):
    """
    Generates realistic surge risk labels using a weighted multi-factor condition 
    and probabilistic assignment to avoid rigid thresholding.
    """
    labels = []
    np.random.seed(42)
    
    for _, row in df.iterrows():
        pressure_score = 0
        
        # 1. Base Volume Pressure
        volume_ratio = row['actual_patients'] / row['baseline_patients']
        if volume_ratio > 1.5: pressure_score += 4
        elif volume_ratio > 1.2: pressure_score += 2
        elif volume_ratio > 1.0: pressure_score += 1
        
        # 2. Growth Pressure
        if row['patient_growth_rate'] > 0.2: pressure_score += 2
        elif row['patient_growth_rate'] > 0.1: pressure_score += 1
        
        # 3. Weather / Clinical Pressure
        if row['respiratory_alert'] == 1: pressure_score += 2
        if row['cumulative_rainfall_3day'] > 50: pressure_score += 1
        
        # 4. Operational Strain
        if row['estimated_bed_occupancy'] > 90: pressure_score += 2
        elif row['estimated_bed_occupancy'] > 80: pressure_score += 1
        
        if row['staff_pressure_index'] > 2.0: pressure_score += 1

        # Map pressure score to probability distributions
        if pressure_score >= 8:
            probs = {'LOW': 0.05, 'MEDIUM': 0.15, 'HIGH': 0.40, 'CRITICAL': 0.40}
        elif pressure_score >= 5:
            probs = {'LOW': 0.10, 'MEDIUM': 0.30, 'HIGH': 0.50, 'CRITICAL': 0.10}
        elif pressure_score >= 3:
            probs = {'LOW': 0.30, 'MEDIUM': 0.50, 'HIGH': 0.15, 'CRITICAL': 0.05}
        else:
            probs = {'LOW': 0.70, 'MEDIUM': 0.25, 'HIGH': 0.05, 'CRITICAL': 0.00}
            
        # Sample from the distribution
        classes = list(probs.keys())
        probabilities = list(probs.values())
        chosen_label = np.random.choice(classes, p=probabilities)
        labels.append(chosen_label)
        
    return labels

if __name__ == "__main__":
    engineer_features()

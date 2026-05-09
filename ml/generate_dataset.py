"""
SurgeWatch Advanced Data Simulation
Generates highly realistic synthetic hospital operational data.
Simulates autoregressive trends, causal relationships (weather -> admissions),
weekly/annual seasonality, and controlled stochastic noise.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

from utils import get_data_path

# Simulation Parameters
START_DATE = '2023-01-01'
DAYS_TO_GENERATE = 1095  # 3 years
BASE_PATIENTS = 110
NOISE_LEVEL = 10
SEED = 42

def generate_hospital_data():
    """Generates a realistic time-series dataset for hospital operations."""
    np.random.seed(SEED)
    print("Generating advanced synthetic dataset...")

    dates = [datetime.strptime(START_DATE, '%Y-%m-%d') + timedelta(days=i) for i in range(DAYS_TO_GENERATE)]
    
    data = {
        'date': dates,
        'day_of_week': [d.weekday() for d in dates],
        'month': [d.month for d in dates],
        'is_weekend': [1 if d.weekday() >= 5 else 0 for d in dates],
        'day_of_year': [d.timetuple().tm_yday for d in dates]
    }
    
    df = pd.DataFrame(data)

    # 1. Weather Simulation (Autoregressive)
    # Monsoon season (June-Sept) has higher baseline rainfall and humidity
    is_monsoon = df['month'].isin([6, 7, 8, 9]).astype(int)
    
    # Generate rainfall using a Markov-like process (storms last multiple days)
    rainfall = np.zeros(DAYS_TO_GENERATE)
    humidity = np.zeros(DAYS_TO_GENERATE)
    temperature = np.zeros(DAYS_TO_GENERATE)
    
    for i in range(DAYS_TO_GENERATE):
        if i == 0:
            rainfall[i] = np.random.exponential(scale=2) if is_monsoon[i] else 0
            humidity[i] = np.random.normal(70 if is_monsoon[i] else 50, 5)
            temperature[i] = 28 + np.sin(2 * np.pi * df.loc[i, 'day_of_year'] / 365) * 5 + np.random.normal(0, 1)
            continue
            
        # 30% chance a storm continues, 10% chance one starts in monsoon (2% otherwise)
        start_prob = 0.1 if is_monsoon[i] else 0.02
        if rainfall[i-1] > 0:
            if np.random.rand() < 0.3:
                rainfall[i] = np.random.exponential(scale=15)
            else:
                rainfall[i] = 0
        else:
            if np.random.rand() < start_prob:
                rainfall[i] = np.random.exponential(scale=25)
            else:
                rainfall[i] = 0
                
        # Humidity correlates with rainfall and season
        base_humidity = 80 if is_monsoon[i] else 55
        humidity[i] = base_humidity + (rainfall[i] * 0.5) + (humidity[i-1] * 0.2) + np.random.normal(0, 5)
        humidity[i] = np.clip(humidity[i], 20, 100)
        
        # Temperature has annual seasonality + daily noise + cooling effect from rain
        base_temp = 28 + np.sin(2 * np.pi * df.loc[i, 'day_of_year'] / 365) * 5
        temperature[i] = base_temp - (rainfall[i] * 0.1) + np.random.normal(0, 1.5)

    df['rainfall'] = np.clip(rainfall, 0, None)
    df['humidity'] = humidity
    df['temperature'] = temperature
    
    # Derived weather metrics
    df['humidity_drop'] = df['humidity'].diff().fillna(0) < -15
    df['humidity_drop'] = df['humidity_drop'].astype(int)

    # 2. Operational Events
    # Festivals (e.g., Diwali, New Year, local holidays)
    np.random.seed(SEED + 1)
    df['festival'] = 0
    df['festival_name'] = 'None'
    
    festivals_per_year = 8
    for year in df['date'].dt.year.unique():
        festival_days = np.random.choice(df[df['date'].dt.year == year].index, size=festivals_per_year, replace=False)
        df.loc[festival_days, 'festival'] = 1
        df.loc[festival_days, 'festival_name'] = 'Local Festival'

    # Respiratory Alerts (Causal consequence of weather)
    # High rainfall or sharp humidity drops increase risk of respiratory alerts 1-3 days later
    respiratory_alert = np.zeros(DAYS_TO_GENERATE)
    for i in range(3, DAYS_TO_GENERATE):
        recent_rain = df.loc[i-3:i-1, 'rainfall'].sum()
        recent_humidity_drop = df.loc[i-3:i-1, 'humidity_drop'].sum()
        
        prob = 0.05 # base prob
        if recent_rain > 50: prob += 0.3
        if recent_humidity_drop > 0: prob += 0.2
        if df.loc[i, 'month'] in [11, 12, 1, 2]: prob += 0.15 # Winter flu season
        
        if np.random.rand() < prob:
            respiratory_alert[i] = 1
            
    df['respiratory_alert'] = respiratory_alert

    # 3. Patient Volume (Autoregressive + Causal + Seasonal)
    actual_patients = np.zeros(DAYS_TO_GENERATE)
    
    for i in range(DAYS_TO_GENERATE):
        # Base annual seasonality
        seasonal_multiplier = 1.0 + (np.sin(2 * np.pi * df.loc[i, 'day_of_year'] / 365) * 0.1)
        
        # Weekend effect (lower scheduled, but maybe higher trauma)
        weekend_multiplier = 0.85 if df.loc[i, 'is_weekend'] else 1.05
        
        # Autoregressive component (depends on yesterday)
        ar_term = (actual_patients[i-1] - BASE_PATIENTS) * 0.6 if i > 0 else 0
        
        # Causal impacts
        weather_impact = (df.loc[i, 'rainfall'] * 0.2)
        resp_impact = df.loc[i, 'respiratory_alert'] * 25
        festival_impact = df.loc[i, 'festival'] * 35
        
        # Sum components
        expected_volume = (BASE_PATIENTS * seasonal_multiplier * weekend_multiplier) + ar_term + weather_impact + resp_impact + festival_impact
        
        # Add stochastic noise
        actual_patients[i] = expected_volume + np.random.normal(0, NOISE_LEVEL)

    df['actual_patients'] = np.clip(actual_patients, 30, 400).astype(int)
    df['baseline_patients'] = BASE_PATIENTS

    # Ensure output directory exists
    os.makedirs(os.path.dirname(get_data_path('raw_hospital_data.csv')), exist_ok=True)
    
    output_path = get_data_path('raw_hospital_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated raw dataset with {len(df)} records at {output_path}")

if __name__ == "__main__":
    generate_hospital_data()

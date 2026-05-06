import pandas as pd
import numpy as np
from datetime import timedelta
import random
from utils import get_data_path

def generate_synthetic_data(start_date='2021-01-01', end_date='2024-05-01'):
    """Generates synthetic hospital data simulating Karnataka district patterns."""
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    n_days = len(dates)
    
    # Initialize basic columns
    df = pd.DataFrame({'date': dates})
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Weather simulation (Karnataka general: hot Apr-May, monsoon Jun-Sep, cool Dec-Jan)
    np.random.seed(42)
    random.seed(42)
    
    # Temperature: Base 25, peaks in Apr/May (up to 38), drops in Dec/Jan (down to 15)
    temp_seasonal = 25 + 10 * np.sin((df['month'] - 1) * np.pi / 6 - np.pi/2)
    df['temperature'] = temp_seasonal + np.random.normal(0, 2, n_days)
    
    # Humidity: High during monsoon (Jun-Sep), lower in summer
    humidity_seasonal = 60 + 20 * np.sin((df['month'] - 6) * np.pi / 6)
    df['humidity'] = np.clip(humidity_seasonal + np.random.normal(0, 5, n_days), 20, 100)
    
    # Calculate humidity drop (difference from previous day)
    df['humidity_drop'] = df['humidity'].diff().fillna(0) * -1
    df['humidity_drop'] = df['humidity_drop'].apply(lambda x: x if x > 0 else 0)
    
    # Rainfall: High chance in Monsoon (Jun-Sep)
    rain_prob = df['month'].apply(lambda m: 0.6 if 6 <= m <= 9 else 0.1)
    df['rainfall'] = np.random.binomial(1, rain_prob) * np.random.exponential(15, n_days)
    
    # Festivals (Karnataka Specific)
    df['festival'] = 0
    df['festival_name'] = 'None'
    
    for year in df['date'].dt.year.unique():
        # Ugadi - roughly April
        ugadi_date = pd.Timestamp(year=year, month=4, day=random.randint(1, 15))
        for d in range(-1, 2): # 3 day window
            mask = df['date'] == (ugadi_date + timedelta(days=d))
            df.loc[mask, 'festival'] = 1
            df.loc[mask, 'festival_name'] = 'Ugadi'
            
        # Dasara - roughly October
        dasara_date = pd.Timestamp(year=year, month=10, day=random.randint(5, 20))
        for d in range(-2, 3): # 5 day window
            mask = df['date'] == (dasara_date + timedelta(days=d))
            df.loc[mask, 'festival'] = 1
            df.loc[mask, 'festival_name'] = 'Dasara'
            
        # Rajyotsava - Nov 1
        rajyotsava_date = pd.Timestamp(year=year, month=11, day=1)
        for d in range(0, 2): # 2 day window
            mask = df['date'] == (rajyotsava_date + timedelta(days=d))
            df.loc[mask, 'festival'] = 1
            df.loc[mask, 'festival_name'] = 'Rajyotsava'
            
    # Respiratory Alerts: Triggered by high humidity drop or winter + poor conditions
    df['respiratory_alert'] = 0
    alert_mask = (df['humidity_drop'] > 10) | ((df['temperature'] < 20) & (df['humidity'] < 50))
    # Add random element so not every drop is an alert
    df.loc[alert_mask & (np.random.rand(n_days) > 0.5), 'respiratory_alert'] = 1
    
    # Patients calculation
    df['baseline_patients'] = 100 + np.random.poisson(10, n_days)
    
    # Surge logic
    # Base = baseline
    patients = df['baseline_patients'].copy()
    
    # Weekend surge (accidents/travel)
    patients += df['is_weekend'] * np.random.poisson(15, n_days)
    
    # Festival surge
    patients += df['festival'] * np.random.poisson(30, n_days)
    
    # Respiratory surge
    patients += df['respiratory_alert'] * np.random.poisson(25, n_days)
    
    # Rainfall surge (accidents/infections)
    patients += (df['rainfall'] > 10).astype(int) * np.random.poisson(20, n_days)
    
    # Interaction: Festival + Rainfall = Stronger surge
    interaction_1 = (df['festival'] == 1) & (df['rainfall'] > 5)
    patients += interaction_1.astype(int) * np.random.poisson(25, n_days)
    
    # Interaction: Humidity Drop + Respiratory Alert = Respiratory surge
    interaction_2 = (df['humidity_drop'] > 5) & (df['respiratory_alert'] == 1)
    patients += interaction_2.astype(int) * np.random.poisson(20, n_days)
    
    df['actual_patients'] = patients.astype(int)
    
    # Surge risk calculation based on actual vs baseline (e.g. >1.5x baseline is HIGH risk)
    ratio = df['actual_patients'] / df['baseline_patients']
    df['surge_risk'] = pd.cut(ratio, bins=[0, 1.2, 1.5, float('inf')], labels=['LOW', 'MEDIUM', 'HIGH'])
    
    return df

if __name__ == "__main__":
    print("Generating synthetic hospital data...")
    df = generate_synthetic_data()
    output_path = get_data_path('hospital_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Data successfully generated with {len(df)} rows and saved to {output_path}")

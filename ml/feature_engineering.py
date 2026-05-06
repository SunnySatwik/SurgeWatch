import pandas as pd
import numpy as np
from utils import get_data_path

def engineer_features(df):
    """Adds engineered features to the dataset."""
    df = df.copy()
    
    # Ensure dates are sorted for accurate rolling/shifted features
    df = df.sort_values('date').reset_index(drop=True)
    
    # 1. days_until_festival: Days until the next festival window begins
    festival_dates = df[df['festival'] == 1]['date']
    def get_days_until_next(current_date):
        future_festivals = festival_dates[festival_dates >= current_date]
        if len(future_festivals) > 0:
            return (future_festivals.iloc[0] - current_date).days
        return 30 # Default max value if no future festival in dataset
    
    df['days_until_festival'] = df['date'].apply(get_days_until_next)
    
    # 2. rolling_patient_average: Smooths out daily noise, 7-day trailing average
    # We use shift(1) so we don't leak the current day's target into the feature
    df['rolling_patient_average'] = df['actual_patients'].shift(1).rolling(window=7, min_periods=1).mean()
    # Fill any NaN in the first row with baseline
    df['rolling_patient_average'] = df['rolling_patient_average'].fillna(df['baseline_patients'])
    
    # 3. humidity_delta: Captures sudden changes in humidity which trigger respiratory issues
    df['humidity_delta'] = df['humidity'].diff().fillna(0)
    
    # 4. rainfall_intensity: Binned rainfall amounts for tree-based models to capture non-linear effects
    df['rainfall_intensity'] = pd.cut(
        df['rainfall'], 
        bins=[-1, 1, 15, 40, float('inf')], 
        labels=[0, 1, 2, 3] # 0: None/Trace, 1: Light, 2: Moderate, 3: Heavy
    ).astype(int)
    
    # 5. monday_adjacent: Captures post-weekend surges or weekend drops
    # 0 = Monday, 6 = Sunday
    df['monday_adjacent'] = df['day_of_week'].isin([0, 6]).astype(int)
    
    # 6. seasonal_index: Multiplier representing base hospital load for the season
    def get_seasonal_index(month):
        if month in [6, 7, 8, 9]:
            return 1.5 # Monsoon: waterborne and vector-borne diseases
        elif month in [11, 12, 1]:
            return 1.2 # Winter: respiratory cases
        elif month in [4, 5]:
            return 1.1 # Summer: heat stroke, dehydration
        return 1.0 # Spring/Autumn baseline
        
    df['seasonal_index'] = df['month'].apply(get_seasonal_index)
    
    return df

if __name__ == "__main__":
    print("Loading data for feature engineering...")
    input_path = get_data_path('hospital_data.csv')
    df = pd.read_csv(input_path, parse_dates=['date'])
    
    print("Applying feature engineering...")
    df_engineered = engineer_features(df)
    
    output_path = get_data_path('engineered_data.csv')
    df_engineered.to_csv(output_path, index=False)
    print(f"Engineered data saved to {output_path}")

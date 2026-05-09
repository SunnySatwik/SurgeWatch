"""
SurgeWatch Exploratory Data Analysis (EDA)
Generates visualizations to understand the simulated data,
feature correlations, and target class distributions.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
from utils import get_data_path, get_output_path

def run_eda():
    print("Running Exploratory Data Analysis...")
    
    # Setup output directory
    eda_dir = get_output_path('eda')
    os.makedirs(eda_dir, exist_ok=True)
    
    # Load data
    df = pd.read_csv(get_data_path('engineered_data.csv'))
    df['date'] = pd.to_datetime(df['date'])
    
    # Ensure seaborn style
    sns.set_theme(style="whitegrid")

    # 1. Target Class Distribution
    plt.figure(figsize=(8, 5))
    ax = sns.countplot(data=df, x='surge_risk', order=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], palette='viridis')
    plt.title('Distribution of Surge Risk Levels')
    plt.xlabel('Surge Risk')
    plt.ylabel('Count (Days)')
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                    ha='center', va='baseline', fontsize=10, color='black', xytext=(0, 5), textcoords='offset points')
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'class_distribution.png'), dpi=300)
    plt.close()

    # 2. Correlation Heatmap (Numeric features only)
    numeric_df = df.select_dtypes(include=['number'])
    # Drop some raw/redundant cols for clarity
    cols_to_drop = ['day_of_year', 'baseline_patients']
    numeric_df = numeric_df.drop(columns=[c for c in cols_to_drop if c in numeric_df.columns])
    
    plt.figure(figsize=(16, 12))
    corr = numeric_df.corr()
    
    # Mask upper triangle
    mask = np.triu(np.ones_like(corr, dtype=bool))
    
    sns.heatmap(corr, mask=mask, cmap='coolwarm', vmax=1, vmin=-1, center=0,
                square=True, linewidths=.5, cbar_kws={"shrink": .5}, annot=False)
    plt.title('Feature Correlation Heatmap', fontsize=16)
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'correlation_heatmap.png'), dpi=300)
    plt.close()

    # 3. Time Series: Admissions vs Rainfall (First 365 days to zoom in)
    df_year1 = df.head(365)
    fig, ax1 = plt.subplots(figsize=(14, 6))

    color = 'tab:blue'
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Actual Patients', color=color)
    ax1.plot(df_year1['date'], df_year1['actual_patients'], color=color, alpha=0.8, linewidth=1.5)
    ax1.tick_params(axis='y', labelcolor=color)

    ax2 = ax1.twinx()
    color = 'tab:cyan'
    ax2.set_ylabel('Rainfall (mm)', color=color)
    ax2.bar(df_year1['date'], df_year1['rainfall'], color=color, alpha=0.3, width=1.0)
    ax2.tick_params(axis='y', labelcolor=color)

    plt.title('Patient Volume and Rainfall (1 Year Sample)')
    fig.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'timeseries_admissions_vs_rainfall.png'), dpi=300)
    plt.close()

    # 4. Boxplot: Patients by Surge Risk
    plt.figure(figsize=(8, 6))
    sns.boxplot(data=df, x='surge_risk', y='actual_patients', order=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], palette='viridis')
    plt.title('Actual Patients Distribution by Assigned Risk Level')
    plt.xlabel('Assigned Surge Risk')
    plt.ylabel('Actual Patients')
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'patients_by_risk_level.png'), dpi=300)
    plt.close()

    print(f"EDA visualizations saved to {eda_dir}/")

if __name__ == "__main__":
    import numpy as np # import inside script as well since it's used in mask
    run_eda()

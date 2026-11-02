"""
AirGuard: Phase 4 - Comprehensive Exploratory Data Analysis & Visualization Suite
==================================================================================
Generates publication-quality figures and statistical summaries:
1. Multi-panel pollutant distributions (KDE + Histograms)
2. Pearson correlation matrix heatmap
3. Risk target class distribution & imbalance metrics
4. City-wise pollution rankings with CPCB regulatory standards
5. Monthly and seasonal temporal trends (Winter peak vs Monsoon wash-out)
6. Atmospheric domain ratios (PM2.5/PM10 & Combustion Index) by risk class
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg") # Non-interactive backend for headless figure generation
import matplotlib.pyplot as plt
import seaborn as sns

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config

FIGURES_DIR = os.path.join(Config.BASE_DIR, "reports", "figures")
REPORTS_DIR = os.path.join(Config.BASE_DIR, "reports")
PROCESSED_CSV = os.path.join(Config.BASE_DIR, "dataset", "processed", "processed_air_quality.csv")

os.makedirs(FIGURES_DIR, exist_ok=True)

# Set global aesthetic styling
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["font.size"] = 10
plt.rcParams["axes.titlesize"] = 12
plt.rcParams["axes.labelsize"] = 11

PALETTE = {
    "lower_risk": "#059669", # Emerald green
    "elevated_risk": "#dc2626", # Crimson red
    "primary": "#1e3a8a", # Deep navy
    "accent": "#0284c7" # Sky blue
}


def load_processed_data():
    """Loads processed dataset from CSV."""
    if not os.path.exists(PROCESSED_CSV):
        raise FileNotFoundError(f"Processed dataset not found at {PROCESSED_CSV}. Run preprocessing.py first.")
    df = pd.read_csv(PROCESSED_CSV)
    df["date_dt"] = pd.to_datetime(df["date"])
    return df


def plot_pollutant_distributions(df):
    """Figure 1: 6-panel Histograms + KDE curves illustrating distribution skewness."""
    print("    [*] Generating Figure 1: Pollutant Distributions...")
    fig, axes = plt.subplots(2, 3, figsize=(16, 9))
    pollutants = [
        ("pm25", "PM2.5 (µg/m³)", "#1e40af"),
        ("pm10", "PM10 (µg/m³)", "#0284c7"),
        ("no2", "NO2 (µg/m³)", "#b45309"),
        ("so2", "SO2 (µg/m³)", "#7c3aed"),
        ("co", "CO (mg/m³)", "#be123c"),
        ("o3", "Ozone (µg/m³)", "#047857")
    ]
    
    for ax, (col, title, color) in zip(axes.flatten(), pollutants):
        sns.histplot(df[col], kde=True, ax=ax, color=color, bins=40, line_kws={"linewidth": 2})
        mean_val = df[col].mean()
        median_val = df[col].median()
        ax.axvline(mean_val, color="red", linestyle="--", linewidth=1.5, label=f"Mean: {mean_val:.1f}")
        ax.axvline(median_val, color="black", linestyle=":", linewidth=1.5, label=f"Median: {median_val:.1f}")
        ax.set_title(title, fontweight="bold")
        ax.set_xlabel("Concentration")
        ax.set_ylabel("Frequency")
        ax.legend(loc="upper right", frameon=True)
        
    fig.suptitle("AirGuard: Ambient Pollutant Empirical Distributions & Skewness", fontsize=15, fontweight="bold", y=0.98)
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "01_pollutant_distributions.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")


def plot_correlation_heatmap(df):
    """Figure 2: Pearson Correlation Heatmap across criteria pollutants, engineered features, and target."""
    print("    [*] Generating Figure 2: Correlation Heatmap...")
    cols = [
        "pm25", "pm10", "no", "no2", "nox", "nh3", "co", "so2", "o3",
        "pm_ratio", "nitrogen_ratio", "combustion_index", "air_quality_risk"
    ]
    labels = [
        "PM2.5", "PM10", "NO", "NO2", "NOx", "NH3", "CO", "SO2", "O3",
        "PM Ratio", "Nitrogen Ratio", "Combustion Index", "Risk Target (y)"
    ]
    
    corr_matrix = df[cols].corr()
    
    plt.figure(figsize=(13, 10))
    sns.heatmap(
        corr_matrix,
        annot=True,
        fmt=".2f",
        cmap="coolwarm",
        vmin=-0.3,
        vmax=1.0,
        xticklabels=labels,
        yticklabels=labels,
        linewidths=0.5,
        cbar_kws={"label": "Pearson Correlation Coefficient (r)"}
    )
    plt.title("AirGuard: Feature Multicollinearity & Risk Target Correlation Matrix", fontsize=14, fontweight="bold", pad=15)
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "02_correlation_heatmap.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")
    return corr_matrix["air_quality_risk"].drop("air_quality_risk").sort_values(ascending=False).to_dict()


def plot_target_class_distribution(df):
    """Figure 3: Class Distribution Bar Plot highlighting empirical class balance."""
    print("    [*] Generating Figure 3: Class Distribution...")
    counts = df["air_quality_risk"].value_counts().sort_index()
    total = len(df)
    labels = ["Class 0: Lower Risk\n(AQI ≤ 100)", "Class 1: Elevated Risk\n(AQI > 100)"]
    colors = [PALETTE["lower_risk"], PALETTE["elevated_risk"]]
    
    fig, ax = plt.subplots(figsize=(8, 6))
    bars = ax.bar(labels, counts.values, color=colors, width=0.55, edgecolor="black", linewidth=1.2)
    
    for bar in bars:
        h = bar.get_height()
        pct = (h / total) * 100
        ax.annotate(f"{h:,}\n({pct:.1f}%)",
                    xy=(bar.get_x() + bar.get_width() / 2, h / 2),
                    xytext=(0, 0), textcoords="offset points",
                    ha='center', va='center', fontsize=12, fontweight='bold', color='white')
        
    ax.set_title("AirGuard: Empirical Risk Target Distribution (air_quality_risk)", fontsize=13, fontweight="bold", pad=12)
    ax.set_ylabel("Number of Daily Observations")
    ax.set_ylim(0, max(counts.values) * 1.15)
    
    # Text annotation explaining stratify requirement
    ax.text(0.5, 0.90, f"Total Valid Observations: {total:,}\nImbalance Ratio: {counts[1]/counts[0]:.2f} : 1 (Stratified Split Mandatory)",
            transform=ax.transAxes, ha="center", fontsize=10, bbox=dict(boxstyle="round,pad=0.5", facecolor="#f1f5f9", edgecolor="#cbd5e1"))
            
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "03_target_class_distribution.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")


def plot_city_rankings(df):
    """Figure 4: Horizontal bar chart of Top 15 Cities by Mean PM2.5 with CPCB annual safety threshold."""
    print("    [*] Generating Figure 4: City Rankings...")
    city_means = df.groupby("city")["pm25"].mean().sort_values(ascending=False).head(15)
    
    fig, ax = plt.subplots(figsize=(12, 8))
    y_pos = np.arange(len(city_means))
    bars = ax.barh(y_pos, city_means.values, color=PALETTE["primary"], edgecolor="black", height=0.65)
    
    # CPCB Annual Standard for PM2.5 is 40 µg/m³; 24-hr safe standard is 60 µg/m³
    ax.axvline(60, color="#dc2626", linestyle="--", linewidth=2, label="CPCB 24-hr Safe Limit (60 µg/m³)")
    ax.axvline(40, color="#f59e0b", linestyle=":", linewidth=2, label="CPCB Annual Standard (40 µg/m³)")
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(city_means.index, fontweight="bold")
    ax.invert_yaxis() # Top polluted city on top
    ax.set_xlabel("Mean PM2.5 Concentration (µg/m³)")
    ax.set_title("Top 15 Most Polluted Indian Cities by Mean PM2.5 (2015–2020)", fontsize=13, fontweight="bold", pad=12)
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 1.5, bar.get_y() + bar.get_height() / 2, f"{w:.1f}", va='center', fontsize=9, fontweight="bold")
        
    ax.legend(loc="lower right", frameon=True)
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "04_city_pollution_rankings.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")


def plot_monthly_and_seasonal_trends(df):
    """Figure 5: Temporal time-series trends by month and season (Winter peak vs Monsoon trough)."""
    print("    [*] Generating Figure 5: Monthly & Seasonal Trends...")
    monthly_stats = df.groupby("month")[["pm25", "pm10", "no2"]].mean()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    
    # Line chart: Monthly Progression
    ax1.plot(months, monthly_stats["pm25"], marker="o", linewidth=2.5, color="#dc2626", label="PM2.5 (µg/m³)")
    ax1.plot(months, monthly_stats["pm10"], marker="s", linewidth=2.5, color="#2563eb", label="PM10 (µg/m³)")
    ax1.plot(months, monthly_stats["no2"], marker="^", linewidth=2.0, color="#d97706", label="NO2 (µg/m³)")
    ax1.set_title("Monthly Mean Pollutant Trajectories (Seasonal Inversion Effect)", fontweight="bold")
    ax1.set_xlabel("Month of Year")
    ax1.set_ylabel("Mean Concentration (µg/m³)")
    ax1.legend(loc="upper right")
    ax1.axvspan(9, 11, color="#fee2e2", alpha=0.5, label="Post-Monsoon Stubble Burning")
    ax1.axvspan(5, 8, color="#dcfce7", alpha=0.5, label="Monsoon Precipitation Scavenging")
    
    # Bar chart: Elevated Risk Proportion by Season
    season_names = {1: "Winter\n(Dec-Feb)", 2: "Summer\n(Mar-May)", 3: "Monsoon\n(Jun-Sep)", 4: "Post-Monsoon\n(Oct-Nov)"}
    season_risk = df.groupby("season")["air_quality_risk"].mean() * 100
    season_labels = [season_names[s] for s in season_risk.index]
    
    bars = ax2.bar(season_labels, season_risk.values, color=["#b91c1c", "#f59e0b", "#059669", "#7f1d1d"], edgecolor="black")
    ax2.set_title("Elevated Pollution Risk Rate by IMD Season (%)", fontweight="bold")
    ax2.set_ylabel("Elevated Risk Probability (%)")
    ax2.set_ylim(0, 100)
    
    for bar in bars:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width() / 2, h + 2, f"{h:.1f}%", ha='center', fontweight="bold")
        
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "05_monthly_seasonal_trends.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")


def plot_pollutant_ratios_by_risk(df):
    """Figure 6: Box plots comparing engineered ratios across the two risk classes."""
    print("    [*] Generating Figure 6: Pollutant Ratios by Risk...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # 1. PM Ratio (PM2.5 / PM10)
    sns.boxplot(x="air_quality_risk", y="pm_ratio", data=df, ax=ax1, palette=[PALETTE["lower_risk"], PALETTE["elevated_risk"]])
    ax1.set_xticklabels(["Class 0: Lower Risk", "Class 1: Elevated Risk"], fontweight="bold")
    ax1.set_title("Fine-to-Coarse PM Ratio (PM2.5 / PM10)", fontweight="bold")
    ax1.set_xlabel("Air Quality Risk Target")
    ax1.set_ylabel("Ratio Value")
    
    # 2. Combustion Index (CO * NO2)
    # Clip for clean visual representation of median differences
    df_temp = df.copy()
    df_temp["combustion_clipped"] = df_temp["combustion_index"].clip(0, 200)
    sns.boxplot(x="air_quality_risk", y="combustion_clipped", data=df_temp, ax=ax2, palette=[PALETTE["lower_risk"], PALETTE["elevated_risk"]])
    ax2.set_xticklabels(["Class 0: Lower Risk", "Class 1: Elevated Risk"], fontweight="bold")
    ax2.set_title("Combustion Indicator Index (CO × NO2)", fontweight="bold")
    ax2.set_xlabel("Air Quality Risk Target")
    ax2.set_ylabel("Index (clipped at 200)")
    
    fig.suptitle("AirGuard: Engineered Feature Separability Across Risk Classes", fontsize=14, fontweight="bold", y=0.98)
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "06_pollutant_ratios_by_risk.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"        Saved to: {out_path}")


def generate_eda_summary_metrics(df, target_corrs):
    """Saves structured summary statistics and correlations to JSON for reports and API consumption."""
    summary = {
        "total_records": len(df),
        "target_distribution": {
            "class_0_lower_risk": int((df["air_quality_risk"] == 0).sum()),
            "class_1_elevated_risk": int((df["air_quality_risk"] == 1).sum()),
            "class_0_pct": round(float((df["air_quality_risk"] == 0).mean() * 100), 2),
            "class_1_pct": round(float((df["air_quality_risk"] == 1).mean() * 100), 2)
        },
        "target_correlations_ranked": {k: round(float(v), 4) for k, v in target_corrs.items()},
        "seasonal_risk_rates": {
            "winter_pct": round(float(df[df['season'] == 1]['air_quality_risk'].mean() * 100), 2),
            "summer_pct": round(float(df[df['season'] == 2]['air_quality_risk'].mean() * 100), 2),
            "monsoon_pct": round(float(df[df['season'] == 3]['air_quality_risk'].mean() * 100), 2),
            "post_monsoon_pct": round(float(df[df['season'] == 4]['air_quality_risk'].mean() * 100), 2)
        },
        "top_5_polluted_cities_pm25": {
            k: round(float(v), 2) for k, v in df.groupby("city")["pm25"].mean().sort_values(ascending=False).head(5).items()
        }
    }
    
    out_json = os.path.join(REPORTS_DIR, "eda_summary_metrics.json")
    with open(out_json, "w") as f:
        json.dump(summary, f, indent=4)
    print(f"\n[SUCCESS] EDA numerical summary saved to: {out_json}")


def run_full_eda():
    """Runs complete exploratory data analysis and figure generation suite."""
    print("=" * 80)
    print("AIRGUARD: PHASE 4 COMPREHENSIVE EXPLORATORY DATA ANALYSIS (EDA)")
    print("=" * 80)
    df = load_processed_data()
    plot_pollutant_distributions(df)
    target_corrs = plot_correlation_heatmap(df)
    plot_target_class_distribution(df)
    plot_city_rankings(df)
    plot_monthly_and_seasonal_trends(df)
    plot_pollutant_ratios_by_risk(df)
    generate_eda_summary_metrics(df, target_corrs)
    print("\n" + "=" * 80)
    print("PHASE 4 EDA SUITE GENERATED 6 PUBLICATION-QUALITY FIGURES SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    run_full_eda()

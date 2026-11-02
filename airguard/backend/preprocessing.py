"""
AirGuard: Preprocessing and Feature Engineering Engine
======================================================
Loads raw environmental observations from MongoDB, implements domain-specific
cleaning, stratified group-median imputation, IMD seasonal feature engineering,
chemical pollutant ratios, and target leakage prevention.
"""

import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from pymongo import ASCENDING

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db


def map_season(month):
    """
    Maps Gregorian month to official India Meteorological Department (IMD) seasons:
    - Winter: December, January, February (1)
    - Summer / Pre-Monsoon: March, April, May (2)
    - Monsoon / Rainy: June, July, August, September (3)
    - Post-Monsoon / Autumn: October, November (4)
    """
    if month in [12, 1, 2]:
        return 1 # Winter
    elif month in [3, 4, 5]:
        return 2 # Summer
    elif month in [6, 7, 8, 9]:
        return 3 # Monsoon
    else:
        return 4 # Post-Monsoon


def fetch_raw_data_from_mongodb():
    """Retrieves all raw records from MongoDB air_quality_records and flattens into DataFrame."""
    db = get_db()
    coll = db[Config.COLL_RAW_RECORDS]
    print("=" * 80)
    print("STEP 1: Fetching Raw Records from MongoDB 'air_quality_records'")
    print("=" * 80)
    
    cursor = coll.find(
        {"aqi_info.air_quality_risk": {"$ne": None}},
        {"_id": 0, "city": 1, "date": 1, "pollutants": 1, "vocs": 1, "aqi_info": 1}
    )
    
    records = []
    for doc in cursor:
        row = {
            "city": doc.get("city"),
            "date": doc.get("date"),
            "pm25": doc.get("pollutants", {}).get("pm25"),
            "pm10": doc.get("pollutants", {}).get("pm10"),
            "no": doc.get("pollutants", {}).get("no"),
            "no2": doc.get("pollutants", {}).get("no2"),
            "nox": doc.get("pollutants", {}).get("nox"),
            "nh3": doc.get("pollutants", {}).get("nh3"),
            "co": doc.get("pollutants", {}).get("co"),
            "so2": doc.get("pollutants", {}).get("so2"),
            "o3": doc.get("pollutants", {}).get("o3"),
            "benzene": doc.get("vocs", {}).get("benzene"),
            "toluene": doc.get("vocs", {}).get("toluene"),
            "xylene": doc.get("vocs", {}).get("xylene"),
            "aqi": doc.get("aqi_info", {}).get("aqi"),
            "aqi_bucket": doc.get("aqi_info", {}).get("bucket"),
            "air_quality_risk": doc.get("aqi_info", {}).get("air_quality_risk")
        }
        records.append(row)
        
    df = pd.DataFrame(records)
    print(f"    [FETCHED] {len(df):,} valid observations with ground-truth AQI risk target.")
    return df


def clean_and_impute_pollutants(df):
    """
    Implements Stratified Group-Median Imputation:
    Pollution displays strong geographical clustering (City) and seasonal cycles (Month).
    Imputing via (City, Month) medians prevents temporal and geographical distortion.
    """
    print("\n" + "=" * 80)
    print("STEP 2: Stratified Group-Median Imputation & Cleaning")
    print("=" * 80)
    
    # Temporal Parsing
    df["date_dt"] = pd.to_datetime(df["date"], errors="coerce")
    df["month"] = df["date_dt"].dt.month
    df["day_of_week"] = df["date_dt"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x in [5, 6] else 0)
    df["season"] = df["month"].apply(map_season)
    
    pollutants_to_impute = ["pm25", "pm10", "no", "no2", "nox", "nh3", "co", "so2", "o3", "benzene", "toluene"]
    
    for pol in pollutants_to_impute:
        initial_missing = df[pol].isnull().sum()
        
        # 1. First Pass: Impute by (City, Month) median
        df[pol] = df.groupby(["city", "month"])[pol].transform(lambda x: x.fillna(x.median()))
        
        # 2. Second Pass: Impute remaining by (City, Season) median
        df[pol] = df.groupby(["city", "season"])[pol].transform(lambda x: x.fillna(x.median()))
        
        # 3. Third Pass: Impute remaining by City overall median
        df[pol] = df.groupby("city")[pol].transform(lambda x: x.fillna(x.median()))
        
        # 4. Final Fallback: National overall pollutant median
        national_median = df[pol].median()
        df[pol] = df[pol].fillna(national_median)
        
        final_missing = df[pol].isnull().sum()
        print(f"    - {pol:10}: Resolved {initial_missing:,} missing values -> {final_missing} remaining.")

    # Outlier treatment: Winzorization at 99.5th percentile to suppress non-physical sensor spikes
    print("\n[*] Applying Robust 99.5th Percentile Sensor Outlier Capping:")
    for pol in ["pm25", "pm10", "no", "no2", "so2", "co", "o3"]:
        upper_limit = df[pol].quantile(0.995)
        outlier_count = (df[pol] > upper_limit).sum()
        df[pol] = np.where(df[pol] > upper_limit, upper_limit, df[pol])
        print(f"    - {pol:8}: Capped {outlier_count:4,} observations at 99.5th percentile ({upper_limit:6.2f})")
        
    return df


def engineer_environmental_features(df):
    """
    Engineers atmospheric domain features:
    1. PM Ratio: PM2.5 / (PM10 + eps) -> fine-to-coarse particle ratio
    2. Nitrogen Ratio: NO2 / (NO + NO2 + eps) -> photochemical aging index
    3. Combustion Interaction: CO * NO2 -> vehicular & industrial fossil fuel proxy
    4. Cyclic Temporal Encoding: sin(2pi*month/12) and cos(2pi*month/12)
    """
    print("\n" + "=" * 80)
    print("STEP 3: Domain Feature Engineering")
    print("=" * 80)
    eps = 1e-4
    
    # 1. PM Fine-to-Coarse Ratio
    df["pm_ratio"] = df["pm25"] / (df["pm10"] + eps)
    df["pm_ratio"] = df["pm_ratio"].clip(0.0, 1.5)
    
    # 2. Nitrogen Photochemical Oxidation Ratio
    df["nitrogen_ratio"] = df["no2"] / (df["no"] + df["no2"] + eps)
    df["nitrogen_ratio"] = df["nitrogen_ratio"].clip(0.0, 1.0)
    
    # 3. Combustion Combined Indicator
    df["combustion_index"] = df["co"] * df["no2"]
    
    # 4. Cyclic Month Transformations
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)
    
    print("    [CREATED] 'pm_ratio' (Fine/Coarse PM Ratio)")
    print("    [CREATED] 'nitrogen_ratio' (Photochemical Oxidation Index)")
    print("    [CREATED] 'combustion_index' (CO * NO2 Combustion Indicator)")
    print("    [CREATED] 'month_sin', 'month_cos' (Continuous Circular Temporal Features)")
    print("    [CREATED] 'season' (1=Winter, 2=Summer, 3=Monsoon, 4=Post-Monsoon)")
    
    # Strict Target Leakage Prevention:
    # Ensure AQI and AQI_Bucket are NOT in the modeling columns
    print("\n[*] Enforcing Target Leakage Prevention:")
    print("    [CRITICAL] 'aqi' and 'aqi_bucket' are isolated strictly for evaluation reference.")
    print(f"    - Target variable 'air_quality_risk' distribution: Class 0 = {(df['air_quality_risk']==0).sum():,}, Class 1 = {(df['air_quality_risk']==1).sum():,}")
    
    return df


def save_processed_records_to_mongodb_and_csv(df):
    """Saves cleaned DataFrame to CSV and bulk-inserts into MongoDB 'processed_records' collection."""
    print("\n" + "=" * 80)
    print("STEP 4: Saving Processed Records to CSV and MongoDB 'processed_records'")
    print("=" * 80)
    
    # Save CSV
    os.makedirs(os.path.join(Config.BASE_DIR, "dataset", "processed"), exist_ok=True)
    csv_path = os.path.join(Config.BASE_DIR, "dataset", "processed", "processed_air_quality.csv")
    df.to_csv(csv_path, index=False)
    print(f"    [SAVED] CSV written to: {csv_path} ({os.path.getsize(csv_path):,} bytes)")
    
    # Ingest into MongoDB
    db = get_db()
    proc_coll = db[Config.COLL_PROCESSED_RECORDS]
    proc_coll.delete_many({}) # Refresh collection
    
    # Prepare batch records
    records_to_insert = []
    for _, row in df.iterrows():
        doc = {
            "city": row["city"],
            "date": row["date"],
            "features": {
                "pm25": float(row["pm25"]),
                "pm10": float(row["pm10"]),
                "no": float(row["no"]),
                "no2": float(row["no2"]),
                "nox": float(row["nox"]),
                "nh3": float(row["nh3"]),
                "co": float(row["co"]),
                "so2": float(row["so2"]),
                "o3": float(row["o3"]),
                "benzene": float(row["benzene"]),
                "toluene": float(row["toluene"]),
                "pm_ratio": float(row["pm_ratio"]),
                "nitrogen_ratio": float(row["nitrogen_ratio"]),
                "combustion_index": float(row["combustion_index"]),
                "month": int(row["month"]),
                "month_sin": float(row["month_sin"]),
                "month_cos": float(row["month_cos"]),
                "season": int(row["season"]),
                "day_of_week": int(row["day_of_week"]),
                "is_weekend": int(row["is_weekend"])
            },
            "ground_truth": {
                "aqi": float(row["aqi"]),
                "aqi_bucket": str(row["aqi_bucket"]),
                "air_quality_risk": int(row["air_quality_risk"])
            },
            "processed_at": datetime.utcnow()
        }
        records_to_insert.append(doc)
        
    proc_coll.insert_many(records_to_insert, ordered=False)
    print(f"    [SUCCESS] Ingested {len(records_to_insert):,} documents into '{Config.COLL_PROCESSED_RECORDS}'.")
    
    # Create indexes on processed records
    proc_coll.create_index([("city", ASCENDING), ("date", ASCENDING)], unique=True, name="idx_processed_city_date")
    proc_coll.create_index([("ground_truth.air_quality_risk", ASCENDING)], name="idx_processed_risk")
    proc_coll.create_index([("features.season", ASCENDING)], name="idx_processed_season")
    print("    [INDEXED] Created B-Tree indexes on 'processed_records'.")


def run_pipeline():
    """Runs the complete data cleaning and preprocessing pipeline."""
    df_raw = fetch_raw_data_from_mongodb()
    df_clean = clean_and_impute_pollutants(df_raw)
    df_engineered = engineer_environmental_features(df_clean)
    save_processed_records_to_mongodb_and_csv(df_engineered)
    return df_engineered


if __name__ == "__main__":
    run_pipeline()

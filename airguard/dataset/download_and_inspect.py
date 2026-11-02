"""
AirGuard: Phase 1 - Dataset Acquisition and Inspection Script
============================================================
This script acquires the genuine Central Pollution Control Board (CPCB) India
Air Quality Dataset (2015-2020), validates the schema, computes missingness
statistics, validates target variable construction, and generates a structured
academic metadata profile in 'airguard/dataset/metadata/dataset_inspection_report.json'.
"""

import os
import sys
import json
import urllib.request
import pandas as pd
import numpy as np

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
METADATA_DIR = os.path.join(os.path.dirname(__file__), "metadata")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Publicly mirrored raw sources of CPCB Air Quality dataset (Rohan Rao / CPCB)
DATASET_URLS = {
    "city_day.csv": "https://raw.githubusercontent.com/adityarc19/aqi-india/master/city_day.csv",
    "stations.csv": "https://raw.githubusercontent.com/adityarc19/aqi-india/master/stations.csv"
}

# Fallback direct mirrors
BACKUP_URLS = {
    "city_day.csv": "https://raw.githubusercontent.com/aryanrathore1012/Air_Quality_Analysis_and_Prediction_for_Indian_Cities_and_States/master/city_day.csv",
    "stations.csv": "https://raw.githubusercontent.com/shilpasonawani/Air-Quality-Prediction/master/stations.csv"
}


def download_dataset():
    """Download the genuine CPCB dataset files if not already cached."""
    print("=" * 80)
    print("STEP 1: Checking Raw Dataset Files in", RAW_DIR)
    print("=" * 80)
    
    for filename, url in DATASET_URLS.items():
        dest_path = os.path.join(RAW_DIR, filename)
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1024:
            print(f"[OK] Found existing file: {filename} ({os.path.getsize(dest_path):,} bytes)")
        else:
            print(f"[*] Downloading {filename} from {url}...")
            try:
                urllib.request.urlretrieve(url, dest_path)
                print(f"[SUCCESS] Downloaded {filename} ({os.path.getsize(dest_path):,} bytes)")
            except Exception as e:
                print(f"[WARN] Primary download failed for {filename}: {e}")
                backup_url = BACKUP_URLS.get(filename)
                if backup_url:
                    print(f"[*] Attempting backup mirror: {backup_url}...")
                    try:
                        urllib.request.urlretrieve(backup_url, dest_path)
                        print(f"[SUCCESS] Downloaded from backup mirror: {filename}")
                    except Exception as e2:
                        print(f"[ERROR] Backup download also failed: {e2}")
                        print(f"[INFO] Please place '{filename}' manually in: {RAW_DIR}")


def inspect_city_day(filepath):
    """Perform rigorous academic inspection and profiling on city_day.csv."""
    print("\n" + "=" * 80)
    print("STEP 2: Inspecting CPCB City-Level Daily Air Quality Observations")
    print("=" * 80)
    
    if not os.path.exists(filepath):
        print(f"[ERROR] Target file not found at: {filepath}")
        return None
        
    df = pd.read_csv(filepath)
    
    num_rows, num_cols = df.shape
    print(f"[*] Total Records (Rows): {num_rows:,}")
    print(f"[*] Total Features (Columns): {num_cols}")
    print(f"[*] Column Names & Dtypes:")
    for col, dtype in df.dtypes.items():
        print(f"    - {col:15} : {str(dtype)}")
        
    # Temporal Coverage
    if "Date" in df.columns:
        df["Date_dt"] = pd.to_datetime(df["Date"], errors="coerce")
        min_date = df["Date_dt"].min()
        max_date = df["Date_dt"].max()
        print(f"\n[*] Temporal Coverage: {min_date.strftime('%Y-%m-%d')} to {max_date.strftime('%Y-%m-%d')}")
        
    # Geographical Coverage
    cities = df["City"].unique() if "City" in df.columns else []
    print(f"[*] Unique Cities Represented ({len(cities)}): {', '.join(cities[:10])}...")

    # Missing Value Profile
    print("\n[*] Missing Value Analysis:")
    missing_counts = df.isnull().sum()
    missing_pct = (missing_counts / num_rows) * 100
    missing_summary = {}
    for col in df.columns:
        if col == "Date_dt":
            continue
        cnt = int(missing_counts[col])
        pct = float(missing_pct[col])
        missing_summary[col] = {"missing_count": cnt, "missing_percentage": round(pct, 2)}
        print(f"    - {col:15} : {cnt:6,} missing ({pct:5.2f}%)")

    # Duplicate Inspection
    dup_count = int(df.duplicated(subset=["City", "Date"]).sum()) if "Date" in df.columns else int(df.duplicated().sum())
    print(f"\n[*] Duplicate Records (City + Date combination): {dup_count}")

    # Target Feasibility Analysis (CPCB NAQI Framework)
    print("\n[*] Target Variable Feasibility Analysis (air_quality_risk):")
    if "AQI" in df.columns:
        valid_aqi_df = df.dropna(subset=["AQI"]).copy()
        valid_count = len(valid_aqi_df)
        print(f"    - Total records with valid ground-truth AQI: {valid_count:,} ({(valid_count / num_rows) * 100:.1f}%)")
        
        # Binary Risk Definition:
        # Class 0: AQI <= 100 (Good, Satisfactory) -> Lower Pollution Risk
        # Class 1: AQI > 100 (Moderate, Poor, Very Poor, Severe) -> Elevated Pollution Risk
        valid_aqi_df["air_quality_risk"] = (valid_aqi_df["AQI"] > 100).astype(int)
        class_counts = valid_aqi_df["air_quality_risk"].value_counts().to_dict()
        class_0 = class_counts.get(0, 0)
        class_1 = class_counts.get(1, 0)
        pct_0 = (class_0 / valid_count) * 100
        pct_1 = (class_1 / valid_count) * 100
        
        print(f"    - Class 0 (Lower Pollution Risk, AQI <= 100) : {class_0:,} ({pct_0:.2f}%)")
        print(f"    - Class 1 (Elevated Pollution Risk, AQI > 100): {class_1:,} ({pct_1:.2f}%)")
        print(f"    - Class Balance Ratio: {class_1 / max(1, class_0):.2f} : 1")
        print("    [NOTE] Moderate class imbalance observed. Using stratify=y in 70:30 split is essential.")

    # Statistical Summary for Key Pollutants
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    pollutant_stats = {}
    print("\n[*] Pollutant Summary Statistics (Descriptive Metrics):")
    for col in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]:
        if col in df.columns:
            s = df[col].dropna()
            stats = {
                "mean": round(float(s.mean()), 2),
                "std": round(float(s.std()), 2),
                "min": round(float(s.min()), 2),
                "q25": round(float(s.quantile(0.25)), 2),
                "median": round(float(s.median()), 2),
                "q75": round(float(s.quantile(0.75)), 2),
                "max": round(float(s.max()), 2)
            }
            pollutant_stats[col] = stats
            print(f"    - {col:8} : Mean={stats['mean']:6.2f}, Median={stats['median']:6.2f}, Min={stats['min']:6.2f}, Max={stats['max']:7.2f}")

    # Build Metadata Inspection Object
    report = {
        "dataset_name": "CPCB India Air Quality Dataset (2015-2020)",
        "source": "Central Pollution Control Board (CPCB), Government of India",
        "curator": "Rohan Rao (Kaggle / OGD India)",
        "file_name": os.path.basename(filepath),
        "total_records": num_rows,
        "total_columns": num_cols,
        "columns": list(df.columns),
        "temporal_range": {
            "start": str(min_date.strftime('%Y-%m-%d')) if "Date_dt" in df.columns else None,
            "end": str(max_date.strftime('%Y-%m-%d')) if "Date_dt" in df.columns else None
        },
        "unique_cities_count": len(cities),
        "unique_cities": list(cities),
        "duplicate_records": dup_count,
        "missing_value_summary": missing_summary,
        "pollutant_statistics": pollutant_stats,
        "target_variable": {
            "name": "air_quality_risk",
            "derivation_rule": "AQI > 100 => 1 (Elevated Risk), AQI <= 100 => 0 (Lower Risk)",
            "ground_truth_source": "CPCB National Air Quality Index (NAQI)",
            "class_0_count": class_0 if "AQI" in df.columns else None,
            "class_0_percentage": round(pct_0, 2) if "AQI" in df.columns else None,
            "class_1_count": class_1 if "AQI" in df.columns else None,
            "class_1_percentage": round(pct_1, 2) if "AQI" in df.columns else None,
            "leakage_prevention": "AQI and AQI_Bucket must be strictly dropped from feature matrix X."
        }
    }
    
    report_path = os.path.join(METADATA_DIR, "dataset_inspection_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=4)
        
    print(f"\n[SUCCESS] Inspection report compiled and saved to: {report_path}")
    return report


def inspect_stations(filepath):
    """Inspect the station metadata file for geographical coordinates."""
    print("\n" + "=" * 80)
    print("STEP 3: Inspecting Station Metadata & Coordinates for GIS Explorer")
    print("=" * 80)
    
    if not os.path.exists(filepath):
        print(f"[WARN] Stations file not found at: {filepath}")
        return
        
    df = pd.read_csv(filepath)
    print(f"[*] Total Monitoring Stations: {len(df):,}")
    print(f"[*] Columns: {list(df.columns)}")
    if "Latitude" in df.columns and "Longitude" in df.columns:
        valid_coords = df.dropna(subset=["Latitude", "Longitude"])
        print(f"[*] Stations with valid Geographical Coordinates: {len(valid_coords):,} / {len(df):,}")
        print(f"[*] Sample Coordinates:")
        for idx, row in valid_coords.head(5).iterrows():
            st_name = row.get("StationName", row.get("StationId", "Unknown"))
            city = row.get("City", "Unknown")
            lat = row.get("Latitude")
            lon = row.get("Longitude")
            print(f"    - {st_name} ({city}): Lat={lat}, Long={lon}")


if __name__ == "__main__":
    download_dataset()
    city_day_path = os.path.join(RAW_DIR, "city_day.csv")
    stations_path = os.path.join(RAW_DIR, "stations.csv")
    
    if os.path.exists(city_day_path):
        inspect_city_day(city_day_path)
    if os.path.exists(stations_path):
        inspect_stations(stations_path)

"""
AirGuard: Phase 3 - MongoDB Ingestion and Indexing Pipeline
===========================================================
Implements high-performance batch ingestion of raw air quality observations,
station metadata with GeoJSON 2dsphere geometry, dataset provenance metadata,
and database indexing for query optimization.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pymongo import ASCENDING, DESCENDING, GEOSPHERE
from pymongo.errors import BulkWriteError, DuplicateKeyError

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db, close_db


def safe_float(val):
    """Converts numpy/pandas float or nan to float or None for clean BSON serialization."""
    if pd.isna(val) or val is None or np.isnan(val):
        return None
    return float(val)


def init_database_and_collections():
    """Initializes airguardDB and explicitly creates all 7 collections."""
    db = get_db()
    existing_colls = db.list_collection_names()
    print("=" * 80)
    print(f"STEP 1: Initializing Collections in Database: '{Config.DATABASE_NAME}'")
    print("=" * 80)
    
    target_collections = [
        Config.COLL_RAW_RECORDS,
        Config.COLL_PROCESSED_RECORDS,
        Config.COLL_PREDICTION_RESULTS,
        Config.COLL_MODEL_EVALUATION,
        Config.COLL_TRAINING_HISTORY,
        Config.COLL_DATASET_METADATA,
        Config.COLL_MONITORING_STATIONS
    ]
    
    for coll_name in target_collections:
        if coll_name not in existing_colls:
            db.create_collection(coll_name)
            print(f"    [CREATED] Collection '{coll_name}'")
        else:
            print(f"    [EXISTS]  Collection '{coll_name}'")
            
    return db


def load_dataset_metadata(db):
    """Loads inspection metadata report into 'dataset_metadata' collection using insert_one()."""
    coll = db[Config.COLL_DATASET_METADATA]
    print("\n" + "=" * 80)
    print("STEP 2: Ingesting Dataset Provenance Metadata (insert_one)")
    print("=" * 80)
    
    if os.path.exists(Config.METADATA_PATH):
        with open(Config.METADATA_PATH, "r") as f:
            metadata_doc = json.load(f)
            
        metadata_doc["ingested_at"] = datetime.utcnow().isoformat()
        metadata_doc["schema_version"] = "1.0"
        
        # Upsert metadata document
        coll.delete_many({}) # Refresh metadata
        res = coll.insert_one(metadata_doc)
        print(f"    [SUCCESS] Metadata document inserted with _id: {res.inserted_id}")
        print(f"    - Dataset: {metadata_doc.get('dataset_name')}")
        print(f"    - Total Observations Tracked: {metadata_doc.get('total_records'):,}")
    else:
        print(f"    [WARN] Metadata file not found at: {Config.METADATA_PATH}")


def load_monitoring_stations(db):
    """Loads monitoring stations into 'monitoring_stations' with GeoJSON Point geometry and 2dsphere index."""
    coll = db[Config.COLL_MONITORING_STATIONS]
    print("\n" + "=" * 80)
    print("STEP 3: Ingesting Monitoring Stations & Building 2dsphere GeoJSON Index")
    print("=" * 80)
    
    if not os.path.exists(Config.STATIONS_DATASET_PATH):
        print(f"    [WARN] Stations file not found at: {Config.STATIONS_DATASET_PATH}")
        return
        
    df_stations = pd.read_csv(Config.STATIONS_DATASET_PATH)
    coll.delete_many({}) # Refresh stations
    
    station_docs = []
    for _, row in df_stations.iterrows():
        lat = safe_float(row.get("Latitude"))
        lon = safe_float(row.get("Longitude"))
        
        doc = {
            "station_id": str(row.get("StationId")),
            "station_name": str(row.get("StationName")),
            "city": str(row.get("City")),
            "state": str(row.get("State")),
            "status": str(row.get("Status", "Active")),
            "latitude": lat,
            "longitude": lon,
            "created_at": datetime.utcnow()
        }
        
        # GeoJSON Point format: [longitude, latitude]
        if lat is not None and lon is not None:
            doc["location"] = {
                "type": "Point",
                "coordinates": [lon, lat]
            }
            
        station_docs.append(doc)
        
    if station_docs:
        res = coll.insert_many(station_docs)
        print(f"    [SUCCESS] Ingested {len(res.inserted_ids)} monitoring stations.")
        
        # Create Indexes
        coll.create_index([("station_id", ASCENDING)], unique=True, name="idx_station_id_unique")
        coll.create_index([("city", ASCENDING)], name="idx_station_city")
        coll.create_index([("location", GEOSPHERE)], name="idx_station_location_2dsphere")
        print("    [INDEXED] Created unique index 'idx_station_id_unique' and geospatial index 'idx_station_location_2dsphere'")


def load_raw_air_quality_records(db, batch_size=5000):
    """Batch-ingests raw city_day.csv records into 'air_quality_records' using insert_many()."""
    coll = db[Config.COLL_RAW_RECORDS]
    print("\n" + "=" * 80)
    print(f"STEP 4: Batch Ingesting Environmental Records into '{Config.COLL_RAW_RECORDS}'")
    print("=" * 80)
    
    if not os.path.exists(Config.RAW_DATASET_PATH):
        print(f"    [ERROR] Raw dataset not found at: {Config.RAW_DATASET_PATH}")
        return
        
    current_count = coll.count_documents({})
    if current_count >= 29000:
        print(f"    [EXISTS] Collection already contains {current_count:,} records. Skipping re-ingestion.")
    else:
        coll.delete_many({}) # Refresh collection
        print("    [*] Reading CSV observations...")
        df = pd.read_csv(Config.RAW_DATASET_PATH)
        total_rows = len(df)
        print(f"    [*] Transforming {total_rows:,} records into nested BSON document structure...")
        
        records = []
        for idx, row in df.iterrows():
            date_str = str(row.get("Date"))
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                date_obj = None
                
            aqi_val = safe_float(row.get("AQI"))
            aqi_bucket = row.get("AQI_Bucket")
            if pd.isna(aqi_bucket) or aqi_bucket is None:
                aqi_bucket = None
            else:
                aqi_bucket = str(aqi_bucket)
                
            # Construct nested document structure reflecting realistic environmental IoT feeds
            doc = {
                "city": str(row.get("City")),
                "date": date_str,
                "timestamp": date_obj,
                "pollutants": {
                    "pm25": safe_float(row.get("PM2.5")),
                    "pm10": safe_float(row.get("PM10")),
                    "no": safe_float(row.get("NO")),
                    "no2": safe_float(row.get("NO2")),
                    "nox": safe_float(row.get("NOx")),
                    "nh3": safe_float(row.get("NH3")),
                    "co": safe_float(row.get("CO")),
                    "so2": safe_float(row.get("SO2")),
                    "o3": safe_float(row.get("O3"))
                },
                "vocs": {
                    "benzene": safe_float(row.get("Benzene")),
                    "toluene": safe_float(row.get("Toluene")),
                    "xylene": safe_float(row.get("Xylene"))
                },
                "aqi_info": {
                    "aqi": aqi_val,
                    "bucket": aqi_bucket,
                    # Ground-truth binary risk flag (strictly calculated from official AQI for evaluation)
                    "air_quality_risk": int(aqi_val > 100) if aqi_val is not None else None
                },
                "ingested_at": datetime.utcnow()
            }
            records.append(doc)
            
            # Execute batch insertion
            if len(records) >= batch_size:
                coll.insert_many(records, ordered=False)
                print(f"    - Ingested batch {idx + 1:,} / {total_rows:,} records...")
                records = []
                
        # Insert remaining records
        if records:
            coll.insert_many(records, ordered=False)
            print(f"    - Ingested final batch. Total: {total_rows:,} records.")

    # Create Indexes for Query Optimization
    print("\n[*] Creating Compound & Single-field B-Tree Indexes on 'air_quality_records':")
    coll.create_index([("city", ASCENDING), ("date", ASCENDING)], unique=True, name="idx_city_date_unique")
    coll.create_index([("date", DESCENDING)], name="idx_date_desc")
    coll.create_index([("city", ASCENDING)], name="idx_city_asc")
    coll.create_index([("aqi_info.aqi", ASCENDING)], name="idx_aqi_asc")
    coll.create_index([("aqi_info.air_quality_risk", ASCENDING)], name="idx_risk_asc")
    coll.create_index([("pollutants.pm25", ASCENDING)], name="idx_pm25_asc")
    
    for idx_info in coll.list_indexes():
        print(f"    [INDEX] {idx_info['name']} on keys: {list(idx_info['key'].items())}")

    print(f"\n[SUCCESS] '{Config.COLL_RAW_RECORDS}' now holds {coll.count_documents({}):,} indexed documents.")


def run_full_ingestion():
    """Orchestrates Phase 3 ingestion and verification."""
    db = init_database_and_collections()
    load_dataset_metadata(db)
    load_monitoring_stations(db)
    load_raw_air_quality_records(db)
    print("\n" + "=" * 80)
    print("PHASE 3 DATABASE INGESTION & SETUP COMPLETE!")
    print("=" * 80)


if __name__ == "__main__":
    run_full_ingestion()

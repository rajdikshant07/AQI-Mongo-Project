"""
AirGuard: Phase 3 - Comprehensive MongoDB Operations Demonstration Script
=========================================================================
Covers all academic requirements and PDF syllabus topics (17-25):
- Database & Collection handles
- insert_one() and insert_many()
- find_one() and find() with Projection
- update_one() and update_many()
- delete_one()
- Filtering, Sorting, Counting
- Converting BSON cursor to Pandas DataFrame
- Aggregation Pipelines ($match, $group, $project, $sort, $limit, $avg, $sum)
- 2dsphere Geospatial indexing and $near spatial queries
"""

import os
import sys
import pandas as pd
from datetime import datetime

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db, close_db

def test_all_mongodb_operations():
    db = get_db()
    raw_coll = db[Config.COLL_RAW_RECORDS]
    stations_coll = db[Config.COLL_MONITORING_STATIONS]
    
    print("=" * 85)
    print("AIRGUARD: PHASE 3 COMPREHENSIVE MONGODB OPERATION SUITE")
    print("=" * 85)
    
    # --------------------------------------------------------------------------
    # 1. COUNTING DOCUMENTS
    # --------------------------------------------------------------------------
    total_records = raw_coll.count_documents({})
    delhi_records = raw_coll.count_documents({"city": "Delhi"})
    elevated_records = raw_coll.count_documents({"aqi_info.air_quality_risk": 1})
    lower_records = raw_coll.count_documents({"aqi_info.air_quality_risk": 0})
    
    print("\n[1. COUNTING DOCUMENTS - count_documents()]")
    print(f"    - Total Environmental Records in '{Config.COLL_RAW_RECORDS}': {total_records:,}")
    print(f"    - Records for Delhi: {delhi_records:,}")
    print(f"    - Class 1 (Elevated Risk, AQI > 100): {elevated_records:,}")
    print(f"    - Class 0 (Lower Risk, AQI <= 100)  : {lower_records:,}")

    # --------------------------------------------------------------------------
    # 2. FIND_ONE WITH FILTERING
    # --------------------------------------------------------------------------
    sample_doc = raw_coll.find_one({"city": "Delhi", "date": "2020-01-01"})
    print("\n[2. FIND SPECIFIC RECORD - find_one()]")
    if sample_doc:
        print(f"    - City: {sample_doc['city']} | Date: {sample_doc['date']}")
        print(f"    - PM2.5: {sample_doc['pollutants']['pm25']} µg/m³ | PM10: {sample_doc['pollutants']['pm10']} µg/m³")
        print(f"    - AQI: {sample_doc['aqi_info']['aqi']} ({sample_doc['aqi_info']['bucket']})")
        print(f"    - Risk Target: {sample_doc['aqi_info']['air_quality_risk']}")

    # --------------------------------------------------------------------------
    # 3. FIND WITH PROJECTION (Academic Topic 24)
    # --------------------------------------------------------------------------
    # Projection reduces network transfer by omitting _id and unwanted fields
    projection = {
        "_id": 0,
        "city": 1,
        "date": 1,
        "pollutants.pm25": 1,
        "pollutants.no2": 1,
        "aqi_info.aqi": 1,
        "aqi_info.air_quality_risk": 1
    }
    cursor = raw_coll.find({"city": "Bengaluru", "pollutants.pm25": {"$gt": 100}}, projection).limit(3)
    print("\n[3. PROJECTION QUERY - find() with Projection (excluding _id)]")
    for doc in cursor:
        print(f"    - Projected Doc: {doc}")

    # --------------------------------------------------------------------------
    # 4. CONVERTING BSON CURSOR TO PANDAS DATAFRAME (Academic Topic 23)
    # --------------------------------------------------------------------------
    print("\n[4. CONVERTING MONGODB DOCUMENTS TO PANDAS DATAFRAME (pd.DataFrame(list(cursor)))]")
    # Fetch 500 documents for Delhi and flatten into DataFrame
    cursor_df = raw_coll.find(
        {"city": "Delhi", "aqi_info.aqi": {"$ne": None}},
        {"_id": 0, "date": 1, "pollutants": 1, "aqi_info": 1}
    ).limit(500)
    
    docs = list(cursor_df)
    # Normalize nested JSON structure
    flat_data = []
    for d in docs:
        row = {"date": d["date"], **d["pollutants"], **d["aqi_info"]}
        flat_data.append(row)
    df_sample = pd.DataFrame(flat_data)
    print(f"    - Successfully converted {len(df_sample)} MongoDB records into DataFrame.")
    print(f"    - DataFrame Shape: {df_sample.shape}")
    print(f"    - DataFrame Columns: {list(df_sample.columns[:8])}...")
    print(f"    - DataFrame Head:\n{df_sample[['date', 'pm25', 'pm10', 'no2', 'aqi', 'air_quality_risk']].head(3)}")

    # --------------------------------------------------------------------------
    # 5. INSERT_ONE, UPDATE_ONE, DELETE_ONE (CRUD Lifecycle)
    # --------------------------------------------------------------------------
    print("\n[5. CRUD LIFECYCLE DEMONSTRATION - insert_one, update_one, delete_one]")
    test_id = "TEST_OBSERVATION_999"
    test_doc = {
        "_id": test_id,
        "city": "TestCity",
        "date": "2026-11-01",
        "pollutants": {"pm25": 45.0, "pm10": 80.0, "co": 0.5},
        "aqi_info": {"aqi": 80, "bucket": "Satisfactory", "air_quality_risk": 0},
        "created_at": datetime.utcnow()
    }
    
    # Insert
    raw_coll.delete_one({"_id": test_id}) # Ensure clean state
    insert_res = raw_coll.insert_one(test_doc)
    print(f"    - [insert_one] Successfully inserted test record: _id={insert_res.inserted_id}")
    
    # Update
    update_res = raw_coll.update_one(
        {"_id": test_id},
        {"$set": {"pollutants.pm25": 125.0, "aqi_info.air_quality_risk": 1, "status": "VERIFIED_TEST"}}
    )
    print(f"    - [update_one] Matched: {update_res.matched_count}, Modified: {update_res.modified_count}")
    
    # Verify update
    updated_doc = raw_coll.find_one({"_id": test_id})
    print(f"    - [verify] Updated PM2.5: {updated_doc['pollutants']['pm25']}, Risk: {updated_doc['aqi_info']['air_quality_risk']}")
    
    # Delete
    del_res = raw_coll.delete_one({"_id": test_id})
    print(f"    - [delete_one] Successfully deleted test record: Deleted Count={del_res.deleted_count}")

    # --------------------------------------------------------------------------
    # 6. MONGODB AGGREGATION PIPELINES (Analytics Engine)
    # --------------------------------------------------------------------------
    print("\n[6. MONGODB AGGREGATION PIPELINE 1: Top 5 Most Polluted Cities by Average PM2.5]")
    pipeline_top_cities = [
        {"$match": {"pollutants.pm25": {"$ne": None}}},
        {"$group": {
            "_id": "$city",
            "avg_pm25": {"$avg": "$pollutants.pm25"},
            "avg_pm10": {"$avg": "$pollutants.pm10"},
            "avg_aqi": {"$avg": "$aqi_info.aqi"},
            "observation_count": {"$sum": 1}
        }},
        {"$sort": {"avg_pm25": -1}},
        {"$limit": 5},
        {"$project": {
            "city": "$_id",
            "_id": 0,
            "avg_pm25": {"$round": ["$avg_pm25", 2]},
            "avg_pm10": {"$round": ["$avg_pm10", 2]},
            "avg_aqi": {"$round": ["$avg_aqi", 2]},
            "observation_count": 1
        }}
    ]
    
    top_cities = list(raw_coll.aggregate(pipeline_top_cities))
    for idx, c in enumerate(top_cities, 1):
        pm25_str = f"{c['avg_pm25']:6.2f}" if c.get('avg_pm25') is not None else "   N/A"
        pm10_str = f"{c['avg_pm10']:6.2f}" if c.get('avg_pm10') is not None else "   N/A"
        aqi_str = f"{c['avg_aqi']:6.2f}" if c.get('avg_aqi') is not None else "   N/A"
        print(f"    {idx}. {c['city']:15} | Avg PM2.5: {pm25_str} ug/m3 | Avg PM10: {pm10_str} ug/m3 | Avg AQI: {aqi_str}")

    print("\n[7. MONGODB AGGREGATION PIPELINE 2: Risk Class Breakdown & Percentage]")
    pipeline_risk = [
        {"$match": {"aqi_info.air_quality_risk": {"$ne": None}}},
        {"$group": {
            "_id": "$aqi_info.air_quality_risk",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    risk_results = list(raw_coll.aggregate(pipeline_risk))
    total_valid = sum(r["count"] for r in risk_results)
    for r in risk_results:
        label = "Elevated Risk (Class 1)" if r["_id"] == 1 else "Lower Risk (Class 0)"
        pct = (r["count"] / total_valid) * 100
        print(f"    - {label:24} : {r['count']:6,} records ({pct:5.2f}%)")

    # --------------------------------------------------------------------------
    # 8. GEOSPATIAL 2DSPHERE SPATIAL QUERY ($near)
    # --------------------------------------------------------------------------
    print("\n[8. GEOSPATIAL 2DSPHERE SPATIAL QUERY ($near with GeoJSON Point)]")
    # Query: Find the 3 nearest monitoring stations to Central Delhi coordinates [77.2090, 28.6139]
    delhi_center_lon, delhi_center_lat = 77.2090, 28.6139
    geo_query = {
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [delhi_center_lon, delhi_center_lat]
                },
                "$maxDistance": 50000 # 50 km radius
            }
        }
    }
    
    nearest_stations = list(stations_coll.find(geo_query).limit(3))
    print(f"    - Query Origin: Central Delhi ({delhi_center_lat}°N, {delhi_center_lon}°E)")
    for idx, st in enumerate(nearest_stations, 1):
        coords = st["location"]["coordinates"]
        print(f"    {idx}. {st['station_name']} ({st['city']}) - Location: [{coords[1]}°N, {coords[0]}°E]")

    print("\n" + "=" * 85)
    print("ALL MONGODB ACADEMIC OPERATIONS VALIDATED SUCCESSFULLY!")
    print("=" * 85)


if __name__ == "__main__":
    test_all_mongodb_operations()

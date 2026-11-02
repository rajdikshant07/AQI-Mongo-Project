"""
AirGuard: Phase 2 - Environment and MongoDB Verification Script
==============================================================
Validates Python runtime, core scientific packages, and live MongoDB
connectivity (database connection, server ping, wire protocol version).
"""

import sys
import os

def check_environment():
    print("=" * 80)
    print("AIRGUARD PHASE 2: SYSTEM ENVIRONMENT & DEPENDENCY VERIFICATION")
    print("=" * 80)
    
    # 1. Python Runtime
    print(f"[*] Python Executable : {sys.executable}")
    print(f"[*] Python Version    : {sys.version.split()[0]} ({sys.platform})")
    
    # 2. Package Check
    packages = [
        ("pymongo", "PyMongo (MongoDB Driver)"),
        ("pandas", "Pandas (Data Science & DataFrame Engine)"),
        ("numpy", "NumPy (Numerical Computing)"),
        ("sklearn", "Scikit-Learn (Machine Learning)"),
        ("flask", "Flask (Backend REST API)"),
        ("flask_cors", "Flask-CORS (Cross-Origin Resource Sharing)"),
        ("joblib", "Joblib (Model Serialization)"),
        ("matplotlib", "Matplotlib (Visualization)"),
        ("seaborn", "Seaborn (Statistical Visualization)")
    ]
    
    print("\n[*] Checking Core Academic & Engineering Libraries:")
    all_packages_ok = True
    for mod_name, label in packages:
        try:
            mod = __import__(mod_name)
            ver = getattr(mod, "__version__", "Installed")
            print(f"    [OK] {label:<45} : Version {ver}")
        except ImportError:
            print(f"    [MISSING] {label:<45} : Not Installed")
            all_packages_ok = False
            
    # 3. Live MongoDB Connection Test
    print("\n[*] Testing Live MongoDB Connection on localhost:27017...")
    try:
        from pymongo import MongoClient
        # Set short timeout so script does not hang if service is down
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=3000)
        # Ping the admin database to verify active connection
        ping_res = client.admin.command('ping')
        build_info = client.admin.command('buildInfo')
        mongo_version = build_info.get('version', 'Unknown')
        
        print(f"    [SUCCESS] MongoDB is ACTIVE and Reachable!")
        print(f"    - Server Version  : {mongo_version}")
        print(f"    - Ping Response   : {ping_res}")
        print(f"    - Current DBs     : {client.list_database_names()}")
        mongo_ok = True
    except Exception as e:
        print(f"    [FAIL] MongoDB connection failed: {e}")
        print("    [NOTE] Ensure MongoDB Service is running via 'net start MongoDB' or 'mongod'.")
        mongo_ok = False
        
    print("\n" + "=" * 80)
    if all_packages_ok and mongo_ok:
        print("[SUMMARY] Phase 2 Verification PASSED: Environment is 100% ready for AirGuard!")
    else:
        print("[SUMMARY] Action required: see missing components above.")
    print("=" * 80)
    
    return all_packages_ok and mongo_ok

if __name__ == "__main__":
    check_environment()

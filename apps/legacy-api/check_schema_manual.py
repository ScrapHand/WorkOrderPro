import sqlite3
import os

db_path = "workorderpro.db"
if not os.path.exists(db_path):
    print(f"Database {db_path} not found!")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(work_orders)")
    columns = cursor.fetchall()
    print("Columns in work_orders table:")
    found_asset_id = False
    for col in columns:
        print(col)
        if col[1] == 'asset_id':
            found_asset_id = True
    
    if not found_asset_id:
        print("\nERROR: asset_id column MISSING!")
    else:
        print("\nSUCCESS: asset_id column exists.")
    conn.close()

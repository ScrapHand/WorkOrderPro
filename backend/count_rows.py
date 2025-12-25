import sqlite3
import os

db_path = "workorderpro.db"
if not os.path.exists(db_path):
    print("DB FILE MISSING")
else:
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        tables = ['work_orders', 'assets', 'users']
        for t in tables:
            try:
                c.execute(f"SELECT count(*) FROM {t}")
                print(f"{t}: {c.fetchone()[0]}")
            except Exception as e:
                print(f"{t}: ERROR {e}")
                
        conn.close()
    except Exception as e:
        print(f"CONNECTION ERROR: {e}")


import sqlite3

def check_schema():
    conn = sqlite3.connect('workorderpro.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(work_orders)")
    columns = [info[1] for info in cursor.fetchall()]
    print("Columns:", columns)
    
    if "completed_by_user_id" not in columns:
        print("❌ Missing assignment columns!")
        # Attempt fix
        try:
            print("Fixing schema...")
            cursor.execute("ALTER TABLE work_orders ADD COLUMN completed_by_user_id CHAR(32)")
            conn.commit()
            print("✅ Added completed_by_user_id")
        except Exception as e:
            print(f"Fix failed: {e}")
    else:
        print("✅ Schema is correct.")
    
    conn.close()

if __name__ == "__main__":
    check_schema()

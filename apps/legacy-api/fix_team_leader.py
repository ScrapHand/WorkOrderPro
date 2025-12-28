
import sqlite3

conn = sqlite3.connect('workorderpro.db')
cursor = conn.cursor()

print("Fixing 'team_leader' roles...")
cursor.execute("UPDATE users SET role='technician' WHERE role='team_leader'")
print(f"Updated {cursor.rowcount} rows.")

conn.commit()
conn.close()

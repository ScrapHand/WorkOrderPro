
import sqlite3

ALLOWED = {'admin', 'manager', 'technician', 'viewer'}

conn = sqlite3.connect('workorderpro.db')
cursor = conn.cursor()
cursor.execute('SELECT id, email, role FROM users')
rows = cursor.fetchall()
conn.close()

print(f"Checking {len(rows)} users...")
for uid, email, role in rows:
    if role not in ALLOWED:
        print(f"INVALID ROLE: {email} has role '{role}' (Type: {type(role)})")
    else:
        # print(f"Valid: {email} - {role}")
        pass
print("Done.")

import sqlite3
import os

db_path = "workorderpro.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("--- USERS ---")
try:
    c.execute("SELECT id, email, role, password_hash, tenant_id FROM users")
    rows = c.fetchall()
    for r in rows:
        print(f"User: {r[1]} | Role: {r[2]} | Tenant: {r[4]}")
except Exception as e:
    print(e)

print("\n--- TENANTS ---")
try:
    c.execute("SELECT id, name, slug FROM tenants")
    rows = c.fetchall()
    for r in rows:
        print(f"Tenant: {r[1]} ({r[2]}) | ID: {r[0]}")
except Exception as e:
    print(e)

conn.close()

import sqlite3
import os

try:
    conn = sqlite3.connect('workorderpro.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email, full_name, role FROM users")
    users = cursor.fetchall()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"Email: {user[0]}, Role: {user[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")


import sqlite3

def fix_roles():
    conn = sqlite3.connect('apps/legacy-api/workorderpro.db')
    c = conn.cursor()
    
    print("Checking for invalid roles...")
    c.execute("SELECT email, role FROM users WHERE role NOT IN ('admin', 'manager', 'technician', 'viewer')")
    rows = c.fetchall()
    for row in rows:
        print(f"Found invalid role: {row}")
        
    c.execute("UPDATE users SET role='technician' WHERE role='engineer'")
    if c.rowcount > 0:
        print(f"Updated {c.rowcount} users from 'engineer' to 'technician'")
        conn.commit()
    else:
        print("No 'engineer' roles found.")
        
    conn.close()

if __name__ == "__main__":
    fix_roles()

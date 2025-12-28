
import sqlite3

def fix_admin():
    conn = sqlite3.connect('apps/legacy-api/workorderpro.db')
    c = conn.cursor()
    
    # Update admin to UPPERCASE
    c.execute("UPDATE users SET role='ADMIN' WHERE role='admin'")
    if c.rowcount > 0:
        print(f"Updated {c.rowcount} users from 'admin' to 'ADMIN'")
    
    # Also update others just in case
    c.execute("UPDATE users SET role='TECHNICIAN' WHERE role='technician'")
    if c.rowcount > 0:
        print(f"Updated {c.rowcount} users from 'technician' to 'TECHNICIAN'")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_admin()

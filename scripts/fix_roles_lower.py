
import sqlite3

def fix_roles_lower():
    conn = sqlite3.connect('apps/legacy-api/workorderpro.db')
    c = conn.cursor()
    
    # Update to lowercase
    print("Reverting roles to lowercase...")
    
    roles = ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER']
    total_updated = 0
    
    for role in roles:
        c.execute(f"UPDATE users SET role='{role.lower()}' WHERE role='{role}'")
        if c.rowcount > 0:
            print(f"Updated {c.rowcount} users from '{role}' to '{role.lower()}'")
            total_updated += c.rowcount
            
    conn.commit()
    conn.close()
    print(f"Total updated: {total_updated}")

if __name__ == "__main__":
    fix_roles_lower()

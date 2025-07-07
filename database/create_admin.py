import sqlite3
import bcrypt
import os

# --- Configuration ---
ADMIN_USERNAME = 'admin'
ADMIN_EMAIL = 'admin@admin.com'
ADMIN_PASSWORD = 'password123'

# --- Database Setup ---
DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(DATABASE_DIR, 'preciousmeals.db')

def create_admin_user():
    """Creates an admin user in the database."""
    print(f"Connecting to database at {DATABASE_PATH}...")
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        # Check if the admin user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (ADMIN_EMAIL,))
        if cursor.fetchone():
            print(f"Admin user with email '{ADMIN_EMAIL}' already exists.")
            return

        # Hash the password
        hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())

        # Insert the admin user
        print(f"Creating admin user: {ADMIN_USERNAME} ({ADMIN_EMAIL})")
        cursor.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            (ADMIN_USERNAME, ADMIN_EMAIL, hashed_password, 'admin')
        )
        conn.commit()
        print("Admin user created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("Database connection closed.")

if __name__ == '__main__':
    create_admin_user()

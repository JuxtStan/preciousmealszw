import sqlite3
import os

# Get the directory of the current script
database_dir = os.path.dirname(os.path.abspath(__file__))
# Define the path to the database file
db_path = os.path.join(database_dir, 'preciousmeals.db')

# Create a connection to the database
# The database file will be created if it doesn't exist
conn = sqlite3.connect(db_path)

# Create a cursor object to execute SQL commands
cursor = conn.cursor()

# Create the users table for login/signup
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);
''')

# Drop the existing bookings table to apply changes
cursor.execute('DROP TABLE IF EXISTS bookings;')

# Create the bookings table
cursor.execute('''
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    guest_count INTEGER NOT NULL,
    contact_number TEXT NOT NULL,
    event_location TEXT NOT NULL,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users (id)
);
''')

# Commit the changes to the database
conn.commit()

# Close the connection
conn.close()

print(f"Database 'preciousmeals.db' created successfully at {db_path}")

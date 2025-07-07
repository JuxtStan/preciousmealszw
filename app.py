from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import bcrypt
import os

app = Flask(__name__)
CORS(app)  # This will allow the frontend to make requests to the backend

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database', 'preciousmeals.db')

def get_db_connection():
    """Creates a database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/register', methods=['POST'])
def register_user():
    """Registers a new user."""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'message': 'Missing required fields'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            (username, email, hashed_password, 'user')
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username or email already exists'}), 409
    finally:
        conn.close()

    return jsonify({'message': 'User registered successfully', 'userId': user_id}), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    """Logs in an existing user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Request body must be JSON'}), 415

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            user_data = {
                'userId': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
            conn.close()
            return jsonify({'message': 'Login successful', 'user': user_data}), 200
        else:
            conn.close()
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"[ERROR] An error occurred during login: {e}")
        # Ensure the connection is closed even if an error occurs
        if 'conn' in locals() and conn:
            conn.close()
        return jsonify({'message': 'An internal server error occurred.'}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Creates a new booking."""
    data = request.get_json()
    user_id = data.get('userId')

    if not user_id:
        return jsonify({'message': 'Authentication required'}), 401

    event_date = data.get('eventDate')
    event_type = data.get('eventType')
    time_slot = data.get('timeSlot')
    guest_count = data.get('guestCount')
    contact_number = data.get('contactNumber')
    event_location = data.get('eventLocation')
    special_requests = data.get('specialRequests')

    if not all([event_date, event_type, time_slot, guest_count, contact_number, event_location]):
        return jsonify({'message': 'Missing required booking fields'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO bookings (user_id, event_date, event_type, time_slot, guest_count, contact_number, event_location, special_requests)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (user_id, event_date, event_type, time_slot, guest_count, contact_number, event_location, special_requests)
        )
        conn.commit()
        booking_id = cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Failed to create booking due to a database error'}), 500
    finally:
        conn.close()

    return jsonify({'message': 'Booking created successfully', 'bookingId': booking_id}), 201


@app.route('/api/bookings', methods=['GET'])
def get_user_bookings():
    """Fetches all bookings for a specific user."""
    user_id = request.args.get('userId')

    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM bookings WHERE user_id = ? ORDER BY event_date DESC', (user_id,))
        bookings = [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Failed to fetch bookings due to a database error'}), 500
    finally:
        conn.close()

    return jsonify(bookings), 200


@app.route('/api/admin/bookings', methods=['GET'])
def get_all_bookings():
    """Fetches all bookings for admin users."""
    # In a real application, you would verify the user's role from a session or token.
    # For simplicity, we are not implementing full session-based auth here.
    # We assume the frontend will only call this if the user is an admin.

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Join with users table to get user details
        cursor.execute('''
            SELECT b.*, u.username, u.email
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.event_date DESC
        ''')
        bookings = [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Failed to fetch all bookings due to a database error'}), 500
    finally:
        conn.close()

    return jsonify(bookings), 200


@app.route('/api/bookings/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    """Updates the status of a specific booking."""
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'message': 'New status is required'}), 400

    # In a real app, you'd also check if the user has permission to change the status.

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            (new_status, booking_id)
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Booking not found'}), 404

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Failed to update booking status due to a database error'}), 500
    finally:
        conn.close()

    return jsonify({'message': f'Booking {booking_id} status updated to {new_status}'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)

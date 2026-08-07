import datetime
import os

import jwt
from database import get_database
from werkzeug.security import check_password_hash, generate_password_hash


SECRET_KEY = os.environ.get("SECRET_KEY", "queueless-secret")
RESET_SECRET_KEY = os.environ.get("RESET_SECRET_KEY", SECRET_KEY)


def _get_database_connection():
    return get_database()


def get_user_by_id(user_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass

    cursor.execute(
        "SELECT id, email, name, role, created_at FROM users WHERE id = ?",
        (user_id,)
    )

    user = cursor.fetchone()
    connection.close()

    return user


def get_user_by_email(email):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )

    user = cursor.fetchone()
    connection.close()

    return user


def generate_auth_token(user_id, role):
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def generate_reset_token(user_id):
    payload = {
        "reset": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }

    return jwt.encode(payload, RESET_SECRET_KEY, algorithm="HS256")


def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired."}
    except jwt.InvalidTokenError as e:
        print("JWT ERROR:", type(e), e)
        return {"error": "Invalid token."}


def decode_reset_token(token):
    try:
        payload = jwt.decode(token, RESET_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Reset token has expired."}
    except jwt.InvalidTokenError:
        return {"error": "Invalid reset token."}


def register_user(name, email, password, role="customer"):
    if get_user_by_email(email) is not None:
        return {
            "error": "An account with that email already exists.",
            "status_code": 400
        }

    password_hash = generate_password_hash(password)
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (name, email, password_hash, role)
    )

    connection.commit()
    user_id = cursor.lastrowid
    connection.close()

    token = generate_auth_token(user_id, role)

    return {
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role
        }
    }


def authenticate_user(email, password):
    user = get_user_by_email(email)

    if user is None:
        return {
            "error": "Invalid email or password.",
            "status_code": 401
        }

    if not check_password_hash(user["password_hash"], password):
        return {
            "error": "Invalid email or password.",
            "status_code": 401
        }

    token = generate_auth_token(user["id"], user["role"])

    return {
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


def request_password_reset(email):
    user = get_user_by_email(email)

    if user is None:
        return {
            "error": "No account found with that email.",
            "status_code": 404
        }

    token = generate_reset_token(user["id"])

    return {
        "message": "Password reset token generated.",
        "reset_token": token
    }


def reset_password(token, new_password):
    payload = decode_reset_token(token)

    if "error" in payload:
        return payload

    user_id = payload.get("reset")
    if user_id is None:
        return {"error": "Invalid reset token."}

    password_hash = generate_password_hash(new_password)
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (password_hash, user_id)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Password updated successfully."
    }


def update_profile(user_id, name, email):
    existing = get_user_by_email(email)
    if existing is not None and existing["id"] != user_id:
        return {
            "error": "That email is already in use.",
            "status_code": 400
        }

    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        (name, email, user_id)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Profile updated successfully.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }


def change_password(user_id, old_password, new_password):
    """
    Change user password after validating the old password.
    """
    # Get user from database
    user = get_user_by_id(user_id)

    if not user:
        return {"error": "User not found.", "status_code": 404}

    # Verify old password
    if not check_password_hash(user["password_hash"], old_password):
        return {"error": "Old password is incorrect.", "status_code": 401}

    # Validate new password
    if len(new_password) < 6:
        return {"error": "Password must be at least 6 characters long.", "status_code": 400}

    # Update password
    new_password_hash = generate_password_hash(new_password)

    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_password_hash, user_id)
    )

    connection.commit()
    connection.close()

    return {"message": "Password changed successfully."}

import os
from functools import wraps
from flask import request, jsonify

from services.auth_service import decode_token, get_user_by_id


def _get_authorization_token():
    authorization = request.headers.get("Authorization", "")

    if authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]

    return None


def auth_required(role=None):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            token = _get_authorization_token()

            if token is None:
                return jsonify({
                    "error": "Authorization token required."
                }), 401

            payload = decode_token(token)

            if "error" in payload:
                return jsonify(payload), 401

            user = get_user_by_id(payload["sub"])

            if user is None:
                return jsonify({
                    "error": "Invalid token."
                }), 401

            if role and user["role"] != role:
                return jsonify({
                    "error": "Insufficient permissions."
                }), 403

            request.current_user = user

            return function(*args, **kwargs)

        return wrapper

    return decorator

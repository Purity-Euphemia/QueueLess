from flask import Blueprint, request, jsonify

from auth import auth_required
from services.auth_service import (
    authenticate_user,
    get_user_by_id,
    register_user,
    request_password_reset,
    reset_password,
    update_profile,
    change_password
)


auth_routes = Blueprint(
    "auth_routes",
    __name__
)


@auth_routes.route(
    "/auth/register",
    methods=["POST"]
)
def register():
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Name is required."}), 400

    if not data.get("email"):
        return jsonify({"error": "Email is required."}), 400

    if not data.get("password"):
        return jsonify({"error": "Password is required."}), 400

    result = register_user(
        data["name"],
        data["email"],
        data["password"]
    )

    if "error" in result:
        return jsonify(result), result.get("status_code", 400)

    return jsonify(result), 201


@auth_routes.route(
    "/auth/login",
    methods=["POST"]
)
def login():
    data = request.get_json()

    if not data or not data.get("email"):
        return jsonify({"error": "Email is required."}), 400

    if not data.get("password"):
        return jsonify({"error": "Password is required."}), 400

    result = authenticate_user(
        data["email"],
        data["password"]
    )

    if "error" in result:
        return jsonify(result), result.get("status_code", 401)

    return jsonify(result)


@auth_routes.route(
    "/auth/reset-password",
    methods=["POST"]
)
def reset_password_request():
    data = request.get_json()

    if not data or not data.get("email"):
        return jsonify({"error": "Email is required."}), 400

    result = request_password_reset(
        data["email"]
    )

    if "error" in result:
        return jsonify(result), result.get("status_code", 404)

    return jsonify(result)


@auth_routes.route(
    "/auth/reset-password/confirm",
    methods=["POST"]
)
def confirm_reset_password():
    data = request.get_json()

    if not data or not data.get("token"):
        return jsonify({"error": "Reset token is required."}), 400

    if not data.get("password"):
        return jsonify({"error": "Password is required."}), 400

    result = reset_password(
        data["token"],
        data["password"]
    )

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@auth_routes.route(
    "/auth/profile",
    methods=["GET", "PUT"]
)
@auth_required()
def profile():
    if request.method == "GET":
        user = request.current_user

        return jsonify({
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        })

    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Name is required."}), 400

    if not data.get("email"):
        return jsonify({"error": "Email is required."}), 400

    result = update_profile(
        request.current_user["id"],
        data["name"],
        data["email"]
    )

    if "error" in result:
        return jsonify(result), result.get("status_code", 400)

    return jsonify(result)


@auth_routes.route(
    "/auth/password-change",
    methods=["POST"]
)
@auth_required()
def change_password_route():
    data = request.get_json()

    if not data or not data.get("old_password"):
        return jsonify({"error": "Old password is required."}), 400

    if not data.get("new_password"):
        return jsonify({"error": "New password is required."}), 400

    result = change_password(
        request.current_user["id"],
        data["old_password"],
        data["new_password"]
    )

    if "error" in result:
        return jsonify(result), result.get("status_code", 400)

    return jsonify(result)

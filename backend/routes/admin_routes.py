from flask import Blueprint, request, jsonify

from auth import auth_required
from services.queue_service import (
    call_next_person_service,
    skip_person_service,
    serve_current_person_service,
    open_close_queue_service,
    get_queue_service
)


admin_routes = Blueprint(
    "admin_routes",
    __name__
)


@admin_routes.route(
    "/admin/queues/<int:queue_id>/next",
    methods=["POST"]
)
@auth_required(role='admin')
def call_next_person(queue_id):
    result = call_next_person_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@admin_routes.route(
    "/admin/queues/<int:queue_id>/skip",
    methods=["POST"]
)
@auth_required(role='admin')
def skip_person(queue_id):
    result = skip_person_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@admin_routes.route(
    "/admin/queues/<int:queue_id>/serve",
    methods=["POST"]
)
@auth_required(role='admin')
def serve_person(queue_id):
    result = serve_current_person_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@admin_routes.route(
    "/admin/queues/<int:queue_id>/status",
    methods=["PATCH"]
)
@auth_required(role='admin')
def update_queue_status(queue_id):
    data = request.get_json()

    if not data or not data.get("status"):
        return jsonify({"error": "Queue status is required."}), 400

    result = open_close_queue_service(
        queue_id,
        data["status"]
    )

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@admin_routes.route(
    "/admin/queues/<int:queue_id>/waiting",
    methods=["GET"]
)
@auth_required(role='admin')
def get_waiting_members(queue_id):
    result = get_queue_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)

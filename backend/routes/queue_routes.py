from flask import Blueprint, request, jsonify

from services.queue_service import (
    create_new_queue,
    get_all_queues,
    join_queue_service,
    get_queue_service,
    get_member_position_service,
    leave_queue_service,
    get_queue_status_service,
    get_queue_history_service,
    get_queue_suggestions_service,
    get_now_serving_service
)


queue_routes = Blueprint(
    "queue_routes",
    __name__
)


@queue_routes.route(
    "/queues",
    methods=["POST"]
)
def create_queue():
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Queue name is required."}), 400

    queue = create_new_queue(
        data["name"],
        data.get("service"),
        data.get("branch_name"),
        data.get("category"),
        data.get("description")
    )

    return jsonify({
        "message": "Queue created successfully.",
        "queue": queue
    }), 201


@queue_routes.route(
    "/queues",
    methods=["GET"]
)
def get_queues():
    queues = get_all_queues()
    category = request.args.get("category")
    if category:
        queues = [q for q in queues if q.get("category") == category]

    return jsonify({"queues": queues})


@queue_routes.route(
    "/queues/suggestions",
    methods=["GET"]
)
def get_queue_suggestions():
    suggestions = get_queue_suggestions_service()
    return jsonify(suggestions)


@queue_routes.route(
    "/queues/<int:queue_id>/join",
    methods=["POST"]
)
def join_queue(queue_id):
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Your name is required."}), 400

    result = join_queue_service(
        queue_id,
        data["name"],
        data.get("user_id")
    )

    if "error" in result:
        return jsonify(result), result["status_code"]

    return jsonify(result), 201


@queue_routes.route(
    "/queues/<int:queue_id>",
    methods=["GET"]
)
def get_queue(queue_id):
    result = get_queue_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@queue_routes.route(
    "/queues/<int:queue_id>/status",
    methods=["GET"]
)
def get_queue_status(queue_id):
    result = get_queue_status_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@queue_routes.route(
    "/queues/<int:queue_id>/now-serving",
    methods=["GET"]
)
def get_now_serving(queue_id):
    result = get_now_serving_service(queue_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@queue_routes.route(
    "/queues/<int:queue_id>/history",
    methods=["GET"]
)
def get_queue_history(queue_id):
    result = get_queue_history_service(queue_id=queue_id)
    return jsonify(result)


@queue_routes.route(
    "/queues/<int:queue_id>/members/<int:member_id>",
    methods=["GET"]
)
def get_member_position(
    queue_id,
    member_id
):
    result = get_member_position_service(
        queue_id,
        member_id
    )

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


@queue_routes.route(
    "/queues/<int:queue_id>/members/<int:member_id>",
    methods=["DELETE"]
)
def leave_queue(
    queue_id,
    member_id
):
    result = leave_queue_service(
        queue_id,
        member_id
    )

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)

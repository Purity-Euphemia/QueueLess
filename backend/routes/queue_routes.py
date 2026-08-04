from flask import Blueprint, request, jsonify

from services.queue_service import (
    create_new_queue,
    get_all_queues,
    join_queue_service,
    get_queue_service,
    get_member_position_service,
    leave_queue_service
)


# Create the queue blueprint
queue_routes = Blueprint(
    "queue_routes",
    __name__
)


# -------------------------
# CREATE A QUEUE
# -------------------------

@queue_routes.route(
    "/queues",
    methods=["POST"]
)
def create_queue():

    data = request.get_json()

    # Check if a name was sent
    if not data or not data.get("name"):

        return jsonify({
            "error": "Queue name is required."
        }), 400

    queue = create_new_queue(
        data["name"]
    )

    return jsonify({
        "message": "Queue created successfully.",
        "queue": queue
    }), 201


# -------------------------
# GET ALL QUEUES
# -------------------------

@queue_routes.route(
    "/queues",
    methods=["GET"]
)
def get_queues():

    queues = get_all_queues()

    return jsonify({
        "queues": queues
    })


# -------------------------
# JOIN A QUEUE
# -------------------------

@queue_routes.route(
    "/queues/<int:queue_id>/join",
    methods=["POST"]
)
def join_queue(queue_id):

    data = request.get_json()

    # Check if a name was sent
    if not data or not data.get("name"):

        return jsonify({
            "error": "Your name is required."
        }), 400

    result = join_queue_service(
        queue_id,
        data["name"]
    )

    # Check for an error
    if "error" in result:

        return jsonify(
            result
        ), result["status_code"]

    return jsonify(
        result
    ), 201


# -------------------------
# VIEW ONE QUEUE
# -------------------------

@queue_routes.route(
    "/queues/<int:queue_id>",
    methods=["GET"]
)
def get_queue(queue_id):

    result = get_queue_service(
        queue_id
    )

    if "error" in result:

        return jsonify(
            result
        ), 404

    return jsonify(result)


# -------------------------
# CHECK POSITION
# -------------------------

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

        return jsonify(
            result
        ), 404

    return jsonify(result)


# -------------------------
# LEAVE QUEUE
# -------------------------

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

        return jsonify(
            result
        ), 404

    return jsonify(result)
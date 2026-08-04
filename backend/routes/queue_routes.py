from flask import Blueprint, request

queue_routes = Blueprint("queue_routes", __name__)


@queue_routes.route("/queue/join", methods=["POST"])
def join_queue():

    data = request.get_json()

    name = data["name"]

    return {
        "message": f"{name} joined the queue",
        "position": 1
    }
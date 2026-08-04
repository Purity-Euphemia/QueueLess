from flask import Blueprint, jsonify

from services.queue_service import (
    call_next_person_service
)


# Create the admin blueprint
admin_routes = Blueprint(
    "admin_routes",
    __name__
)


# -------------------------
# CALL NEXT PERSON
# -------------------------

@admin_routes.route(
    "/admin/queues/<int:queue_id>/next",
    methods=["POST"]
)
def call_next_person(queue_id):

    result = call_next_person_service(
        queue_id
    )

    if "error" in result:

        return jsonify(
            result
        ), 404

    return jsonify(result)
from database import get_database


# -------------------------
# CREATE QUEUE
# -------------------------

def create_new_queue(name):

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO queues (name)
        VALUES (?)
        """,
        (name,)
    )

    connection.commit()

    queue_id = cursor.lastrowid

    connection.close()

    return {
        "id": queue_id,
        "name": name,
        "status": "open"
    }


# -------------------------
# GET ALL QUEUES
# -------------------------

def get_all_queues():

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, name, status
        FROM queues
        ORDER BY id
    """)

    queues = cursor.fetchall()

    connection.close()

    queue_list = []

    for queue in queues:

        queue_list.append({
            "id": queue["id"],
            "name": queue["name"],
            "status": queue["status"]
        })

    return queue_list


# -------------------------
# JOIN QUEUE
# -------------------------

def join_queue_service(
    queue_id,
    name
):

    connection = get_database()

    cursor = connection.cursor()

    # Check if queue exists
    cursor.execute(
        """
        SELECT *
        FROM queues
        WHERE id = ?
        """,
        (queue_id,)
    )

    queue = cursor.fetchone()

    if queue is None:

        connection.close()

        return {
            "error": "Queue not found.",
            "status_code": 404
        }

    # Check if queue is open
    if queue["status"] != "open":

        connection.close()

        return {
            "error": "Queue is closed.",
            "status_code": 400
        }

    # Add the user
    cursor.execute(
        """
        INSERT INTO queue_members (
            queue_id,
            name
        )
        VALUES (?, ?)
        """,
        (
            queue_id,
            name
        )
    )

    connection.commit()

    member_id = cursor.lastrowid

    # Count waiting people
    cursor.execute(
        """
        SELECT COUNT(*) AS total
        FROM queue_members
        WHERE queue_id = ?
        AND status = 'waiting'
        """,
        (queue_id,)
    )

    result = cursor.fetchone()

    position = result["total"]

    connection.close()

    return {
        "message": (
            f"{name} joined the queue."
        ),
        "member_id": member_id,
        "queue_id": queue_id,
        "position": position,
        "people_ahead": position - 1
    }


# -------------------------
# GET ONE QUEUE
# -------------------------

def get_queue_service(
    queue_id
):

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM queues
        WHERE id = ?
        """,
        (queue_id,)
    )

    queue = cursor.fetchone()

    if queue is None:

        connection.close()

        return {
            "error": "Queue not found."
        }

    cursor.execute(
        """
        SELECT *
        FROM queue_members
        WHERE queue_id = ?
        AND status = 'waiting'
        ORDER BY id
        """,
        (queue_id,)
    )

    members = cursor.fetchall()

    connection.close()

    member_list = []

    for position, member in enumerate(
        members,
        start=1
    ):

        member_list.append({
            "id": member["id"],
            "name": member["name"],
            "position": position,
            "status": member["status"]
        })

    return {
        "queue": {
            "id": queue["id"],
            "name": queue["name"],
            "status": queue["status"]
        },
        "total_waiting": len(
            member_list
        ),
        "members": member_list
    }


# -------------------------
# CHECK POSITION
# -------------------------

def get_member_position_service(
    queue_id,
    member_id
):

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM queue_members
        WHERE id = ?
        AND queue_id = ?
        """,
        (
            member_id,
            queue_id
        )
    )

    member = cursor.fetchone()

    if member is None:

        connection.close()

        return {
            "error": (
                "Queue member not found."
            )
        }

    if member["status"] != "waiting":

        connection.close()

        return {
            "name": member["name"],
            "status": member["status"],
            "message": (
                "You are no longer waiting."
            )
        }

    cursor.execute(
        """
        SELECT COUNT(*) AS people_ahead
        FROM queue_members
        WHERE queue_id = ?
        AND status = 'waiting'
        AND id < ?
        """,
        (
            queue_id,
            member_id
        )
    )

    result = cursor.fetchone()

    people_ahead = (
        result["people_ahead"]
    )

    connection.close()

    return {
        "name": member["name"],
        "status": member["status"],
        "position": (
            people_ahead + 1
        ),
        "people_ahead": (
            people_ahead
        )
    }


# -------------------------
# CALL NEXT PERSON
# -------------------------

def call_next_person_service(
    queue_id
):

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM queue_members
        WHERE queue_id = ?
        AND status = 'waiting'
        ORDER BY id
        LIMIT 1
        """,
        (queue_id,)
    )

    next_person = cursor.fetchone()

    if next_person is None:

        connection.close()

        return {
            "error": (
                "Nobody is waiting."
            )
        }

    cursor.execute(
        """
        UPDATE queue_members
        SET status = 'called'
        WHERE id = ?
        """,
        (
            next_person["id"],
        )
    )

    connection.commit()

    connection.close()

    return {
        "message": (
            f"{next_person['name']} "
            "is the next person."
        ),
        "member": {
            "id": (
                next_person["id"]
            ),
            "name": (
                next_person["name"]
            ),
            "status": "called"
        }
    }


# -------------------------
# LEAVE QUEUE
# -------------------------

def leave_queue_service(
    queue_id,
    member_id
):

    connection = get_database()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM queue_members
        WHERE id = ?
        AND queue_id = ?
        """,
        (
            member_id,
            queue_id
        )
    )

    member = cursor.fetchone()

    if member is None:

        connection.close()

        return {
            "error": (
                "Queue member not found."
            )
        }

    cursor.execute(
        """
        UPDATE queue_members
        SET status = 'left'
        WHERE id = ?
        """,
        (member_id,)
    )

    connection.commit()

    connection.close()

    return {
        "message": (
            f"{member['name']} "
            "left the queue."
        ),
        "status": "left"
    }
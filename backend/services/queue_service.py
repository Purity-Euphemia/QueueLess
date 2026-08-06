import datetime

from database import get_database

DEFAULT_SERVICE_SECONDS = 180


def _get_database_connection():
    return get_database()


def _get_branch_id(cursor, branch_name):
    if not branch_name:
        return None

    cursor.execute(
        "SELECT id FROM branches WHERE name = ?",
        (branch_name,)
    )

    branch = cursor.fetchone()

    if branch:
        return branch["id"]

    cursor.execute(
        "INSERT INTO branches (name) VALUES (?)",
        (branch_name,)
    )

    return cursor.lastrowid


def _get_queue(cursor, queue_id):
    cursor.execute(
        "SELECT q.id, q.name, q.status, q.service, b.name AS branch_name "
        "FROM queues q "
        "LEFT JOIN branches b ON q.branch_id = b.id "
        "WHERE q.id = ?",
        (queue_id,)
    )

    return cursor.fetchone()


def _get_ticket_number(cursor, queue):
    prefix = queue["service"][:1].upper() if queue["service"] else queue["name"][:1].upper()

    cursor.execute(
        "SELECT COUNT(*) AS total FROM tickets WHERE queue_id = ?",
        (queue["id"],)
    )

    count = cursor.fetchone()["total"] + 1

    return f"{prefix}{queue['id']:02d}-{count:03d}"


def _get_average_wait_seconds(cursor, queue_id):
    cursor.execute(
        "SELECT AVG(strftime('%s', served_at) - strftime('%s', called_at)) AS avg_time "
        "FROM tickets "
        "WHERE queue_id = ? AND status = 'served' "
        "AND called_at IS NOT NULL AND served_at IS NOT NULL",
        (queue_id,)
    )

    result = cursor.fetchone()
    if result is None or result["avg_time"] is None:
        return DEFAULT_SERVICE_SECONDS

    return int(result["avg_time"])


def _create_notification(cursor, user_id, ticket_id, message):
    if user_id is None:
        return

    cursor.execute(
        "INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)",
        (user_id, ticket_id, message)
    )


def create_new_queue(name, service=None, branch_name=None):
    connection = _get_database_connection()
    cursor = connection.cursor()

    branch_id = _get_branch_id(cursor, branch_name)

    cursor.execute(
        "INSERT INTO queues (name, service, branch_id) VALUES (?, ?, ?)",
        (name, service, branch_id)
    )

    connection.commit()
    queue_id = cursor.lastrowid
    connection.close()

    return {
        "id": queue_id,
        "name": name,
        "service": service,
        "branch_name": branch_name,
        "status": "open"
    }


def get_all_queues():
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT q.id, q.name, q.status, q.service, b.name AS branch_name "
        "FROM queues q "
        "LEFT JOIN branches b ON q.branch_id = b.id "
        "ORDER BY q.id"
    )

    rows = cursor.fetchall()
    connection.close()

    queues = []
    for queue in rows:
        queues.append({
            "id": queue["id"],
            "name": queue["name"],
            "service": queue["service"],
            "branch_name": queue["branch_name"],
            "status": queue["status"]
        })

    return queues


def get_queue_service(queue_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    queue = _get_queue(cursor, queue_id)
    if queue is None:
        connection.close()
        return {"error": "Queue not found."}

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'waiting' ORDER BY id",
        (queue_id,)
    )
    waiting = cursor.fetchall()

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'called' ORDER BY called_at LIMIT 1",
        (queue_id,)
    )
    current_ticket = cursor.fetchone()

    connection.close()

    members = []
    for position, ticket in enumerate(waiting, start=1):
        members.append({
            "id": ticket["id"],
            "name": ticket["name"],
            "ticket_number": ticket["ticket_number"],
            "position": position,
            "status": ticket["status"],
            "joined_at": ticket["joined_at"]
        })

    return {
        "queue": {
            "id": queue["id"],
            "name": queue["name"],
            "service": queue["service"],
            "branch_name": queue["branch_name"],
            "status": queue["status"]
        },
        "total_waiting": len(members),
        "current_ticket": {
            "id": current_ticket["id"],
            "name": current_ticket["name"],
            "ticket_number": current_ticket["ticket_number"],
            "status": current_ticket["status"],
            "called_at": current_ticket["called_at"]
        } if current_ticket else None,
        "members": members
    }


def get_member_position_service(queue_id, member_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE id = ? AND queue_id = ?",
        (member_id, queue_id)
    )
    ticket = cursor.fetchone()

    if ticket is None:
        connection.close()
        return {"error": "Queue member not found."}

    if ticket["status"] != "waiting":
        connection.close()
        return {
            "name": ticket["name"],
            "ticket_number": ticket["ticket_number"],
            "status": ticket["status"],
            "message": "You are no longer waiting."
        }

    cursor.execute(
        "SELECT COUNT(*) AS people_ahead FROM tickets "
        "WHERE queue_id = ? AND status = 'waiting' AND id < ?",
        (queue_id, member_id)
    )
    result = cursor.fetchone()
    people_ahead = result["people_ahead"]

    average_wait_seconds = _get_average_wait_seconds(cursor, queue_id)
    estimated_wait = (people_ahead + 1) * average_wait_seconds

    connection.close()

    return {
        "name": ticket["name"],
        "ticket_number": ticket["ticket_number"],
        "status": ticket["status"],
        "position": people_ahead + 1,
        "people_ahead": people_ahead,
        "estimated_wait_seconds": estimated_wait,
        "estimated_wait_minutes": max(1, round(estimated_wait / 60))
    }


def _format_wait_time(seconds):
    minutes = int(round(seconds / 60.0))
    return f"{minutes} min" if minutes > 0 else "Less than a minute"


def join_queue_service(queue_id, name, user_id=None):
    connection = _get_database_connection()
    cursor = connection.cursor()

    queue = _get_queue(cursor, queue_id)
    if queue is None:
        connection.close()
        return {"error": "Queue not found.", "status_code": 404}

    if queue["status"] != "open":
        connection.close()
        return {"error": "Queue is closed.", "status_code": 400}

    ticket_number = _get_ticket_number(cursor, queue)

    cursor.execute(
        "INSERT INTO tickets (queue_id, user_id, name, ticket_number) VALUES (?, ?, ?, ?)",
        (queue_id, user_id, name, ticket_number)
    )
    ticket_id = cursor.lastrowid

    cursor.execute(
        "SELECT COUNT(*) AS total FROM tickets WHERE queue_id = ? AND status = 'waiting'",
        (queue_id,)
    )
    count = cursor.fetchone()["total"]

    average_wait_seconds = _get_average_wait_seconds(cursor, queue_id)
    estimated_wait = (count - 1) * average_wait_seconds

    _create_notification(
        cursor,
        user_id,
        ticket_id,
        f"You joined {queue['name']}. Your ticket is {ticket_number}."
    )

    connection.commit()
    connection.close()

    return {
        "message": f"{name} joined the queue.",
        "member_id": ticket_id,
        "ticket_number": ticket_number,
        "queue_id": queue_id,
        "position": count,
        "people_ahead": max(count - 1, 0),
        "estimated_wait_minutes": max(1, round(estimated_wait / 60)),
        "estimated_wait_seconds": estimated_wait
    }


def get_queue_status_service(queue_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    queue = _get_queue(cursor, queue_id)
    if queue is None:
        connection.close()
        return {"error": "Queue not found."}

    cursor.execute(
        "SELECT COUNT(*) AS waiting FROM tickets WHERE queue_id = ? AND status = 'waiting'",
        (queue_id,)
    )
    waiting = cursor.fetchone()["waiting"]

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'called' ORDER BY called_at LIMIT 1",
        (queue_id,)
    )
    current_ticket = cursor.fetchone()

    average_wait_seconds = _get_average_wait_seconds(cursor, queue_id)
    estimated_wait = waiting * average_wait_seconds

    connection.close()

    return {
        "queue_id": queue_id,
        "current_ticket": {
            "id": current_ticket["id"],
            "name": current_ticket["name"],
            "ticket_number": current_ticket["ticket_number"],
            "status": current_ticket["status"],
            "called_at": current_ticket["called_at"]
        } if current_ticket else None,
        "waiting_count": waiting,
        "estimated_wait_minutes": max(0, round(estimated_wait / 60)),
        "estimated_wait": _format_wait_time(estimated_wait)
    }


def get_queue_history_service(queue_id=None, user_id=None):
    connection = _get_database_connection()
    cursor = connection.cursor()

    query = "SELECT * FROM tickets"
    params = []

    if queue_id is not None and user_id is not None:
        query += " WHERE queue_id = ? AND user_id = ?"
        params = [queue_id, user_id]
    elif queue_id is not None:
        query += " WHERE queue_id = ?"
        params = [queue_id]
    elif user_id is not None:
        query += " WHERE user_id = ?"
        params = [user_id]

    query += " ORDER BY joined_at DESC"
    cursor.execute(query, params)

    tickets = cursor.fetchall()
    connection.close()

    history = []
    for ticket in tickets:
        history.append({
            "id": ticket["id"],
            "queue_id": ticket["queue_id"],
            "ticket_number": ticket["ticket_number"],
            "name": ticket["name"],
            "status": ticket["status"],
            "joined_at": ticket["joined_at"],
            "called_at": ticket["called_at"],
            "served_at": ticket["served_at"],
            "left_at": ticket["left_at"],
            "skipped_at": ticket["skipped_at"]
        })

    return {"tickets": history}


def leave_queue_service(queue_id, member_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE id = ? AND queue_id = ?",
        (member_id, queue_id)
    )
    ticket = cursor.fetchone()

    if ticket is None:
        connection.close()
        return {"error": "Queue member not found."}

    cursor.execute(
        "UPDATE tickets SET status = 'left', left_at = CURRENT_TIMESTAMP WHERE id = ?",
        (member_id,)
    )

    connection.commit()
    connection.close()

    return {
        "message": f"{ticket['name']} left the queue.",
        "status": "left"
    }


def call_next_person_service(queue_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'waiting' ORDER BY id LIMIT 1",
        (queue_id,)
    )
    next_person = cursor.fetchone()

    if next_person is None:
        connection.close()
        return {"error": "Nobody is waiting."}

    cursor.execute(
        "UPDATE tickets SET status = 'called', called_at = CURRENT_TIMESTAMP WHERE id = ?",
        (next_person["id"],)
    )

    _create_notification(
        cursor,
        next_person["user_id"],
        next_person["id"],
        f"Please proceed to the counter. Ticket {next_person['ticket_number']} is now being served."
    )

    connection.commit()
    connection.close()

    return {
        "message": f"{next_person['name']} is the next person.",
        "member": {
            "id": next_person["id"],
            "name": next_person["name"],
            "ticket_number": next_person["ticket_number"],
            "status": "called"
        }
    }


def skip_person_service(queue_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'called' ORDER BY called_at LIMIT 1",
        (queue_id,)
    )
    current = cursor.fetchone()

    if current is None:
        connection.close()
        return {"error": "No called ticket to skip."}

    cursor.execute(
        "UPDATE tickets SET status = 'skipped', skipped_at = CURRENT_TIMESTAMP WHERE id = ?",
        (current["id"],)
    )

    connection.commit()
    connection.close()

    return {
        "message": f"{current['name']} was skipped.",
        "ticket_number": current["ticket_number"],
        "status": "skipped"
    }


def serve_current_person_service(queue_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE queue_id = ? AND status = 'called' ORDER BY called_at LIMIT 1",
        (queue_id,)
    )
    current = cursor.fetchone()

    if current is None:
        connection.close()
        return {"error": "No current called ticket to serve."}

    cursor.execute(
        "UPDATE tickets SET status = 'served', served_at = CURRENT_TIMESTAMP WHERE id = ?",
        (current["id"],)
    )

    connection.commit()
    connection.close()

    return {
        "message": f"{current['name']} has been served.",
        "ticket_number": current["ticket_number"],
        "status": "served"
    }


def open_close_queue_service(queue_id, status):
    if status not in ("open", "closed"):
        return {"error": "Invalid queue status."}

    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM queues WHERE id = ?",
        (queue_id,)
    )
    queue = cursor.fetchone()
    if queue is None:
        connection.close()
        return {"error": "Queue not found."}

    cursor.execute(
        "UPDATE queues SET status = ? WHERE id = ?",
        (status, queue_id)
    )

    connection.commit()
    connection.close()

    return {
        "message": f"Queue has been {status}.",
        "queue_id": queue_id,
        "status": status
    }


def get_queue_suggestions_service():
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT q.id, q.name, q.service, q.status, b.name AS branch_name "
        "FROM queues q "
        "LEFT JOIN branches b ON q.branch_id = b.id "
        "WHERE q.status = 'open' "
        "ORDER BY q.id"
    )

    queues = cursor.fetchall()
    suggestions = []

    for queue in queues:
        cursor.execute(
            "SELECT COUNT(*) AS waiting FROM tickets WHERE queue_id = ? AND status = 'waiting'",
            (queue["id"],)
        )
        waiting = cursor.fetchone()["waiting"]

        average_wait_seconds = _get_average_wait_seconds(cursor, queue["id"])
        suggestions.append({
            "id": queue["id"],
            "name": queue["name"],
            "service": queue["service"],
            "branch_name": queue["branch_name"],
            "waiting": waiting,
            "estimated_wait": _format_wait_time(waiting * average_wait_seconds)
        })

    connection.close()
    return {"suggestions": suggestions}


def get_notifications_for_user(user_id):
    connection = _get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    notifications = cursor.fetchall()
    connection.close()

    results = []
    for notification in notifications:
        results.append({
            "id": notification["id"],
            "ticket_id": notification["ticket_id"],
            "message": notification["message"],
            "delivered": bool(notification["delivered"]),
            "created_at": notification["created_at"]
        })

    return {"notifications": results}

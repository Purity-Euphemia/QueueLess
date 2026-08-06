import sqlite3


def get_database():

    # Connect to the SQLite database
    connection = sqlite3.connect("queueless.db")

    # Allow us to use column names
    connection.row_factory = sqlite3.Row

    return connection


def create_tables():

    # Connect to the database
    connection = get_database()

    cursor = connection.cursor()

    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create branches table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS branches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create queues table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS queues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_id INTEGER,
            name TEXT NOT NULL,
            service TEXT,
            status TEXT DEFAULT 'open',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (branch_id) REFERENCES branches(id)
        )
    """)

    # Migrate existing queues table columns if needed
    cursor.execute("PRAGMA table_info(queues)")
    existing_columns = [row[1] for row in cursor.fetchall()]

    if "branch_id" not in existing_columns:
        cursor.execute("ALTER TABLE queues ADD COLUMN branch_id INTEGER")

    if "service" not in existing_columns:
        cursor.execute("ALTER TABLE queues ADD COLUMN service TEXT")

    if "created_at" not in existing_columns:
        cursor.execute("ALTER TABLE queues ADD COLUMN created_at TEXT")
        cursor.execute(
            "UPDATE queues SET created_at = datetime('now') WHERE created_at IS NULL"
        )

    # Create tickets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER NOT NULL,
            user_id INTEGER,
            name TEXT NOT NULL,
            ticket_number TEXT NOT NULL,
            status TEXT DEFAULT 'waiting',
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            called_at TEXT,
            served_at TEXT,
            left_at TEXT,
            skipped_at TEXT,
            notes TEXT,
            FOREIGN KEY (queue_id) REFERENCES queues(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Create notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            ticket_id INTEGER,
            message TEXT NOT NULL,
            delivered INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ticket_id) REFERENCES tickets(id)
        )
    """)

    # Preserve compatibility with older installations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS queue_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'waiting',
            FOREIGN KEY (queue_id) REFERENCES queues(id)
        )
    """)

    connection.commit()
    connection.close()

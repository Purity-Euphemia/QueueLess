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

    # Create the queues table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS queues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'open'
        )
    """)

    # Create the queue members table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS queue_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'waiting',

            FOREIGN KEY (queue_id)
            REFERENCES queues(id)
        )
    """)

    # Save the changes
    connection.commit()

    # Close the database
    connection.close()
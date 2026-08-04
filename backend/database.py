import sqlite3


def get_database():
    connection = sqlite3.connect("queueless.db")

    return connection
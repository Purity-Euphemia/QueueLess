from flask import Flask
from flask_cors import CORS

from database import create_tables
from routes.queue_routes import queue_routes
from routes.admin_routes import admin_routes


# Create the Flask application
app = Flask(__name__)


# Register the user queue routes
app.register_blueprint(queue_routes)


# Register the admin routes
app.register_blueprint(admin_routes)


# Home route
@app.route("/")
def home():
    return {
        "message": "Welcome to QueueLess!",
        "status": "Backend is running"
    }


if __name__ == "__main__":

    # Create the database tables
    create_tables()

    # Start the Flask server
    app.run(debug=True)
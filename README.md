# QueueLess

QueueLess is a smart digital queue management system that helps people join and track service queues without standing in long physical lines.

Users can join a queue online, view their position, and see how many people are ahead of them. Administrators can view the queue and call the next person.

## Problem

People often spend a lot of time standing in queues at places such as:

* Hospitals
* Banks
* Government offices
* Schools
* Restaurants
* Service centers

QueueLess helps reduce unnecessary physical waiting by allowing users to join and monitor a queue digitally.

## Features

### User Features

* Join a queue online
* View queue position
* See the number of people ahead
* Leave a queue
* Check queue status

### Admin Features

* Create a queue
* View all queues
* View people waiting
* Call the next person

## Technologies

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python
* Flask
* Flask-CORS

### Database

* SQLite

## Project Structure

```text
QueueLess/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── models.py
│   ├── routes/
│   │   ├── admin_routes.py
│   │   └── queue_routes.py
│   └── services/
│       └── queue_service.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .gitignore
├── README.md
└── requirements.txt
```

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/QueueLess.git
```

Move into the project folder:

```bash
cd QueueLess
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate the virtual environment:

### Linux

```bash
source .venv/bin/activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

## Run the Backend

Open a terminal and move into the backend folder:

```bash
cd backend
```

Start the Flask application:

```bash
python3 app.py
```

The backend should run at:

```text
http://127.0.0.1:5000
```

## Run the Frontend

Open another terminal and move into the frontend folder:

```bash
cd frontend
```

Start a local server:

```bash
python3 -m http.server 5500
```

Open this address in your browser:

```text
http://127.0.0.1:5500
```

## API Endpoints

| Method   | Endpoint                                 | Description                       |
| -------- | ---------------------------------------- | --------------------------------- |
| `GET`    | `/`                                      | Check that the backend is running |
| `POST`   | `/queues`                                | Create a new queue                |
| `GET`    | `/queues`                                | View all queues                   |
| `POST`   | `/queues/<queue_id>/join`                | Join a queue                      |
| `GET`    | `/queues/<queue_id>`                     | View a queue                      |
| `GET`    | `/queues/<queue_id>/members/<member_id>` | Check a user's position           |
| `DELETE` | `/queues/<queue_id>/members/<member_id>` | Leave a queue                     |
| `POST`   | `/admin/queues/<queue_id>/next`          | Call the next person              |

## Future Features

* User authentication
* Admin login
* Real-time queue updates
* Estimated waiting time
* Queue notifications
* QR code queue joining
* Mobile-friendly improvements
* Multiple service locations

## Project Status

🚧 Currently under development.

## License

This project is created for learning and hackathon purposes.

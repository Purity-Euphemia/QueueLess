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

```
QueueLess/
├── backend/
│   ├── app.py                          # Flask application factory
│   ├── auth.py                         # JWT authentication middleware
│   ├── database.py                     # Database initialization and schema
│   ├── model.py                        # Data models (legacy)
│   ├── queueless.db                    # SQLite database
│   ├── routes/
│   │   ├── admin_routes.py             # Admin API endpoints
│   │   ├── auth_routes.py              # Authentication endpoints
│   │   └── queue_routes.py             # User queue endpoints
│   └── services/
│       ├── auth_service.py             # Authentication business logic
│       └── queue_service.py            # Queue management business logic
│
├── frontend/
│   ├── index.html                      # Home page with auth-aware nav
│   ├── index.js                        # Home page logic
│   ├── auth.js                         # Centralized API client
│   ├── login.html & login.js           # Login page
│   ├── register.html & register.js     # Registration page
│   ├── dashboard.html & dashboard.js   # User dashboard
│   ├── profile.html & profile.js       # User profile management
│   ├── queue-history.html & queue-history.js    # Queue history viewer
│   ├── admin-dashboard.html & admin-dashboard.js # Admin panel
│   └── style.css                       # Global styles with responsive design
│
├── .gitignore
├── README.md                           # This file
└── requirements.txt                    # Python dependencies
```

## Installation & Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd QueueLess
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
python3 app.py
```

Backend runs at: `http://127.0.0.1:5000`

### Terminal 2: Start Frontend

```bash
cd frontend
python3 -m http.server 5500
```

Frontend runs at: `http://127.0.0.1:5500`

### Open in Browser

Navigate to `http://127.0.0.1:5500/index.html`

## Authentication

The application uses JWT (JSON Web Tokens) for secure authentication:

1. Users register with email and password
2. Backend generates a 12-hour JWT token
3. Token is stored in localStorage
4. All API calls include the token in the Authorization header
5. Session automatically logs out on 401 Unauthorized
6. Protected routes require valid tokens with admin roles for admin endpoints

### Test Credentials (after registration)

Create your own account through the registration page.
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

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

    if "category" not in existing_columns:
        cursor.execute("ALTER TABLE queues ADD COLUMN category TEXT")

    if "description" not in existing_columns:
        cursor.execute("ALTER TABLE queues ADD COLUMN description TEXT")

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

    seed_data(cursor)

    connection.commit()
    connection.close()


def seed_data(cursor):
    # Check if we already have seeded categories
    cursor.execute("SELECT COUNT(*) AS count FROM queues WHERE category IS NOT NULL")
    if cursor.fetchone()["count"] > 0:
        return  # already seeded

    # Seed data
    seeds = [
        # Hospital
        ("City General Hospital", "General Medicine", "hospital", "Consultation with general practitioners and basic healthcare needs"),
        ("City General Hospital", "Pediatrics", "hospital", "Specialized care for infants, children, and adolescents"),
        ("City General Hospital", "Emergency Care", "hospital", "Urgent care for critical health situations"),
        ("St. Jude Dental Clinic", "Teeth Cleaning", "hospital", "Routine cleanings and preventative checkups"),
        ("St. Jude Dental Clinic", "Orthodontics", "hospital", "Braces, aligners, and dental corrections"),
        
        # Bank
        ("Apex Bank Downtown", "Teller Transactions", "bank", "Deposits, withdrawals, and quick account tasks"),
        ("Apex Bank Downtown", "Account Opening", "bank", "Open new savings, checking, or certificate accounts"),
        ("Apex Bank Downtown", "Loan Consultation", "bank", "Mortgage, personal loan, and auto financing services"),
        ("Fidelity Trust", "Wealth Management", "bank", "Financial planning, investments, and advisory services"),
        
        # Pharmacy
        ("WellCare Pharmacy", "Prescription Refill", "pharmacy", "Drop off or pick up prescribed medications"),
        ("WellCare Pharmacy", "Vaccinations", "pharmacy", "Flu shots, Covid boosters, and travel vaccines"),
        ("Metro Pharmacy Drive-Thru", "Express Pickup", "pharmacy", "Quick pickup of pre-ordered prescriptions"),
        
        # Salon
        ("Glow Hair Salon", "Haircut & Styling", "salon", "Modern haircuts, styling, and washing"),
        ("Glow Hair Salon", "Hair Coloring", "salon", "Full coloring, highlights, and touchups"),
        ("The Gentleman's Barber", "Classic Shave & Haircut", "salon", "Traditional hot towel shave and grooming"),
        
        # Government
        ("Department of Motor Vehicles (DMV)", "Driver License", "government", "New license applications, renewals, and driving tests"),
        ("Department of Motor Vehicles (DMV)", "Vehicle Registration", "government", "Registration renewals, titles, and plate transfers"),
        ("City Hall Passport Office", "New Passport Application", "government", "First time passports and renewal documentation processing"),
        
        # Restaurant
        ("The Olive Bistro", "Table Seating", "restaurant", "Waitlist for dine-in tables"),
        ("The Olive Bistro", "Takeaway Pickup", "restaurant", "Pick up freshly prepared takeout orders"),
        ("Sakura Sushi Bar", "Ramen Station", "restaurant", "Counter seating for ramen and hot bowls")
    ]
    
    for name, service, category, description in seeds:
        cursor.execute(
            "INSERT INTO queues (name, service, category, description, status) VALUES (?, ?, ?, ?, 'open')",
            (name, service, category, description)
        )

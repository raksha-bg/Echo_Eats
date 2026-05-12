import sqlite3
import os

db_path = 'db.sqlite3'

def init_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create FoodItems table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS FoodItems (
        FoodID INTEGER PRIMARY KEY AUTOINCREMENT,
        FoodName TEXT NOT NULL,
        Price REAL NOT NULL,
        Category TEXT NOT NULL,
        Quantity INTEGER DEFAULT 0,
        ImageName TEXT
    )
    ''')

    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_logged_in BOOLEAN DEFAULT FALSE
    )
    ''')

    # Create orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        items TEXT,
        customer_details TEXT,
        razorpay_order_id TEXT,
        payment_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create session_carts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS session_carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        food_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (food_id) REFERENCES FoodItems(FoodID)
    )
    ''')

    # Insert sample food items
    cursor.execute("DELETE FROM FoodItems")
    if True:
        sample_foods = [
            ('Margherita Pizza', 199, 'Pizza', 0, '01_Margherita.jpeg'),
            ('Farmhouse Pizza', 249, 'Pizza', 0, '02_Farmhouse.jpeg'),
            ('Pepperoni Pizza', 299, 'Pizza', 0, '03_Pepperoni.jpeg'),
            ('Veggie Burger', 129, 'Burger', 0, '04_VeggieBurger.jpeg'),
            ('Chicken Burger', 179, 'Burger', 0, '05_ChickenBurger.jpeg'),
            ('Cheese Burger', 149, 'Burger', 0, '06_CheeseBurger.jpeg'),
            ('Chicken Biryani', 299, 'Main Course', 0, '07_ChickenBiryani.jpeg'),
            ('North Indian Thali', 349, 'Main Course', 0, '08_Thali.jpeg'),
            ('Masala Dosa', 89, 'Snacks', 0, '09_MasalaDosa.jpeg'),
            ('Obbattu', 49, 'Dessert', 0, '10_Obbattu.jpeg'),
            ('Vangi Bath', 79, 'Main Course', 0, '11_VangiBath.jpeg'),
        ]
        cursor.executemany('INSERT INTO FoodItems (FoodName, Price, Category, Quantity, ImageName) VALUES (?, ?, ?, ?, ?)', sample_foods)

    # Insert a sample user if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', ('Test User', 'test@example.com', 'password123'))

    conn.commit()
    conn.close()
    print("Database initialized successfully with sample data.")

if __name__ == '__main__':
    init_db()

import sqlite3
import os

DB_PATH = 'platform.db'

def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # --- TABLES ---

    # Posts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alias TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT DEFAULT 'Normal',
            timestamp TEXT NOT NULL,
            status TEXT DEFAULT 'Open',
            type TEXT DEFAULT 'story'
        )
    ''')

    # Applications Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            applied_days TEXT NOT NULL,
            motivation TEXT NOT NULL,
            experience TEXT NOT NULL,
            areas TEXT NOT NULL, -- Stored as comma-separated
            status TEXT DEFAULT 'Pending'
        )
    ''')

    # References Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS refs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_id INTEGER,
            name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            email TEXT NOT NULL,
            quote TEXT NOT NULL,
            FOREIGN KEY(app_id) REFERENCES applications(id)
        )
    ''')

    # Stats Table (Simplified for tracking totals)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS platform_stats (
            key TEXT PRIMARY KEY,
            value INTEGER DEFAULT 0
        )
    ''')

    # --- SEED DATA ---

    # Initial Stats
    stats = [
        ('total_posts', 9),
        ('resolved_posts', 1),
        ('verified_helpers', 42),
        ('lives_touched', 890),
        ('total_responses', 5),
        ('pending_apps', 2),
        ('top_points', 5200)
    ]
    cursor.executemany('INSERT INTO platform_stats (key, value) VALUES (?, ?)', stats)

    # Initial Posts
    posts = [
        ('Silent Wolf', "I feel like I can't keep going.", 'High', '2 hours ago'),
        ('Golden Phoenix', "Anxiety is making it hard to focus on my exams. Does anyone have tips for staying calm?", 'Normal', '5 hours ago'),
        ('Brave Sparrow', "Finding this community has been the first step to feeling better.", 'Normal', '1 day ago')
    ]
    cursor.executemany('INSERT INTO posts (alias, content, priority, timestamp) VALUES (?, ?, ?, ?)', posts)

    # Initial Application (Fatima)
    cursor.execute('''
        INSERT INTO applications (name, email, applied_days, motivation, experience, areas)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        "Fatima Al-Rashid", "fatima.alrashid@email.com", "9 days ago",
        "Having struggled with severe anxiety during my own university years, I know how isolating it feels...",
        "Certified peer counselor. Informally supported 12+ students through academic and personal crises.",
        "Anxiety, Academic-Stress, Loneliness"
    ))
    fatima_id = cursor.lastrowid
    
    cursor.executemany('''
        INSERT INTO refs (app_id, name, relationship, email, quote)
        VALUES (?, ?, ?, ?, ?)
    ''', [
        (fatima_id, "Prof. Sana Mirza", "Academic supervisor", "s.mirza@university.edu", "Fatima demonstrated exceptional emotional intelligence..."),
        (fatima_id, "Bilal Ahmed", "Peer I supported", "bilal.a@email.com", "Fatima helped me through a period when I was failing my courses...")
    ])

    # Initial Application (James)
    cursor.execute('''
        INSERT INTO applications (name, email, applied_days, motivation, experience, areas)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        "James Okonkwo", "james.okonkwo@email.com", "8 days ago",
        "I believe that everyone deserves a listening ear. My goal is to provide a safe space...",
        "Volunteered at a local community center for 2 years providing emotional support to youth.",
        "Depression, Career, Grief"
    ))
    james_id = cursor.lastrowid
    
    cursor.execute('''
        INSERT INTO refs (app_id, name, relationship, email, quote)
        VALUES (?, ?, ?, ?, ?)
    ''', (james_id, "Dr. Linda Chen", "Mentor", "linda.chen@center.org", "James is a dedicated and compassionate volunteer..."))

    conn.commit()
    conn.close()
    print("Database initialized and seeded successfully.")

if __name__ == '__main__':
    init_db()

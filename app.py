from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import random
import os
import re

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

DB_PATH = 'platform.db'

# --- AI SENTIMENT ENGINE ---
CRISIS_LEXICON = {
    'high_risk': ['suicide', 'kill myself', 'end it all', 'want to die', 'don\'t want to live', 'goodbye everyone', 'no point left', 'better off dead'],
    'medium_risk': ['hopeless', 'depressed', 'can\'t stop crying', 'lonely', 'darkness', 'trapped', 'giving up', 'hurt myself'],
    'urgent_needs': ['help', 'now', 'please', 'someone', 'listen', 'hurting']
}

def analyze_risk(text):
    text = text.lower()
    score = 0
    for word in CRISIS_LEXICON['high_risk']:
        if word in text: score += 40
    for word in CRISIS_LEXICON['medium_risk']:
        if word in text: score += 15
    for word in CRISIS_LEXICON['urgent_needs']:
        if word in text: score += 5
    
    if score >= 40: return "Critical", "High", score
    if score >= 15: return "Distressed", "Medium", score
    return "Stable", "Normal", score

# --- DB HELPERS ---
def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

def execute_db(query, args=()):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query, args)
    conn.commit()
    conn.close()

# --- ROUTES ---
@app.route('/health')
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/')
def landing(): return send_from_directory(app.static_folder, 'index.html')

@app.route('/seeker')
def seeker_page(): return send_from_directory(app.static_folder, 'seeker.html')

@app.route('/volunteer')
def volunteer_page(): return send_from_directory(app.static_folder, 'volunteer.html')

@app.route('/resources')
def resources_page(): return send_from_directory(app.static_folder, 'resources.html')

@app.route('/admin')
def admin_page(): return send_from_directory(app.static_folder, 'admin.html')

@app.route('/admin_login.html')
def admin_login(): return send_from_directory(app.static_folder, 'admin_login.html')

# --- API ---

@app.route('/api/posts', methods=['GET', 'POST'])
def handle_posts():
    if request.method == 'POST':
        data = request.json
        if not data or 'content' not in data:
            return jsonify({"error": "Bad Request"}), 400
        sentiment, priority, score = analyze_risk(data['content'])
        execute_db('INSERT INTO posts (alias, content, priority, timestamp, status) VALUES (?, ?, ?, ?, ?)', 
                   (data['alias'], data['content'], priority, 'Just now', sentiment))
        execute_db('UPDATE platform_stats SET value = value + 1 WHERE key = "total_posts"')
        return jsonify({"status": "Success"}), 201
    posts = query_db('SELECT * FROM posts ORDER BY id DESC')
    return jsonify([dict(p) for p in posts]), 200

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    rows = query_db('SELECT * FROM platform_stats')
    stats = {row['key']: row['value'] for row in rows}
    stats['avg_time'] = "12.4m"
    stats['top_helper_name'] = "Nabiha Nasir"
    return jsonify(stats), 200

@app.route('/api/admin/applications', methods=['GET'])
def get_applications():
    apps = query_db('SELECT * FROM applications WHERE status = "Pending"')
    result = []
    for a in apps:
        app_dict = dict(a)
        app_dict['areas'] = a['areas'].split(', ')
        refs = query_db('SELECT name, relationship, email, quote FROM refs WHERE app_id = ?', [a['id']])
        app_dict['references'] = [dict(r) for r in refs]
        result.append(app_dict)
    return jsonify(result), 200

@app.route('/api/admin/applications/<int:app_id>/approve', methods=['POST'])
def approve_application(app_id):
    execute_db('UPDATE applications SET status = "Approved" WHERE id = ?', [app_id])
    execute_db('UPDATE platform_stats SET value = value - 1 WHERE key = "pending_apps"')
    execute_db('UPDATE platform_stats SET value = value + 1 WHERE key = "verified_helpers"')
    return jsonify({"status": "Success"}), 200

@app.route('/api/admin/applications/<int:app_id>/reject', methods=['POST'])
def reject_application(app_id):
    execute_db('UPDATE applications SET status = "Rejected" WHERE id = ?', [app_id])
    execute_db('UPDATE platform_stats SET value = value - 1 WHERE key = "pending_apps"')
    return jsonify({"status": "Success"}), 200

@app.route('/api/verify', methods=['POST'])
def verify():
    colors = ["Blue", "Golden", "Silent", "Brave", "Kind"]
    animals = ["Sparrow", "Wolf", "Phoenix", "Panda", "Eagle"]
    alias = f"{random.choice(colors)} {random.choice(animals)}"
    return jsonify({"status": "verified", "alias": alias}), 200

@app.route('/api/resources/helplines', methods=['GET'])
def get_helplines():
    return jsonify({"global": [{"name": "Lifeline", "number": "988", "region": "Global"}], "pakistan": [{"name": "Aman", "number": "1166", "region": "Pakistan"}]}), 200

@app.route('/api/resources/education', methods=['GET'])
def get_education():
    return jsonify([{"category": "Anxiety", "title": "Panic Attacks", "content": "Sample content."}]), 200

@app.route('/api/grounding', methods=['GET'])
def get_grounding():
    return jsonify([{"title": "5-4-3-2-1", "content": "Sample content."}]), 200

@app.route('/api/mood', methods=['POST'])
def log_mood(): return jsonify({"status": "mood logged"}), 200

@app.route('/api/apply', methods=['POST'])
def apply_helper():
    data = request.json
    execute_db('INSERT INTO applications (name, email, applied_days, motivation, experience, areas) VALUES (?, ?, ?, ?, ?, ?)',
               (data['name'], data['email'], 'Today', data['experience'], data['experience'], 'General'))
    execute_db('UPDATE platform_stats SET value = value + 1 WHERE key = "pending_apps"')
    return jsonify({"status": "Success"}), 200

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    return jsonify([{"name": "Nabiha Nasir", "points": 5200, "status": "Verified"}]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

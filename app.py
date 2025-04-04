from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os, uuid
import config, db

app = Flask(__name__)
# Configure upload folder for images
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER

# Intialize database schema , creating tables if they don't exist
db.initialize_db()

@app.route('/')
def index():
    # Render main page template and pass AMap API key for the map
    return render_template('index.html', amap_key=config.AMAP_WEB_KEY)

@app.route('/api/comments', methods=['GET', 'POST'])
def comments():
    if request.method == 'GET':
        # Fetch all comment markers (no replies) and return as JSON
        comments = db.get_comments()
        return jsonify({"success": True, "comments": comments})
    else:
        # Handle new comment submission
        name = request.form.get('name', '').strip()
        text = request.form.get('text', '').strip()
        lat = request.form.get('lat')
        lng = request.form.get('lng')
        if not name or not text or not lat or not lng:
            return jsonify({"success": False, "error": "必要信息不能为空"}), 400
        try:
            lat = float(lat); lng = float(lng)
        except:
            return jsonify({"success": False, "error": "无效的坐标"}), 400

        img_url = None
        # If an image file is included, save it to static/img
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                ext = os.path.splitext(filename)[1]
                # Generate a unique filename to avoid collisions
                new_name = f"{uuid.uuid4().hex}{ext}"
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_name)
                file.save(file_path)
                img_url = f"img/{new_name}"

        # Insert the new comment into the database
        comment_id, created_at = db.add_comment(name, text, img_url, lat, lng)
        if comment_id:
            return jsonify({
                "success": True,
                "comment": {
                    "id": comment_id,
                    "name": name,
                    "text": text,
                    "img_url": f"/static/{img_url}" if img_url else None,
                    "lat": lat,
                    "lng": lng,
                    "created_at": created_at
                }
            })
        else:
            return jsonify({"success": False, "error": "留言添加失败，请重试"}), 500

@app.route('/api/comments/<int:comment_id>', methods=['GET'])
def comment_detail(comment_id):
    # Retrieve a specific comment and all its replies
    comment = db.get_comment(comment_id)
    if not comment:
        return jsonify({"success": False, "error": "该留言不存在"}), 404
    replies = db.get_replies(comment_id)
    return jsonify({"success": True, "comment": comment, "replies": replies})

@app.route('/api/replies', methods=['POST'])
def add_reply():
    # Handle new reply submission
    comment_id = request.form.get('comment_id')
    name = request.form.get('name', '').strip()
    text = request.form.get('text', '').strip()
    if not comment_id or not name or not text:
        return jsonify({"success": False, "error": "必要信息不能为空"}), 400
    try:
        comment_id = int(comment_id)
    except:
        return jsonify({"success": False, "error": "无效的评论ID"}), 400

    img_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            filename = secure_filename(file.filename)
            ext = os.path.splitext(filename)[1]
            new_name = f"{uuid.uuid4().hex}{ext}"
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_name)
            file.save(file_path)
            img_url = f"img/{new_name}"

    reply_id, created_at = db.add_reply(comment_id, name, text, img_url)
    if reply_id:
        return jsonify({
            "success": True,
            "reply": {
                "id": reply_id,
                "comment_id": comment_id,
                "name": name,
                "text": text,
                "img_url": f"/static/{img_url}" if img_url else None,
                "created_at": created_at
            }
        })
    else:
        return jsonify({"success": False, "error": "回复添加失败，请重试"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
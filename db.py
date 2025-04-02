import psycopg2
from datetime import datetime
from config import DB_CONFIG

def get_db_connection():
    """创建数据库连接"""
    return psycopg2.connect(**DB_CONFIG)

def get_comments():
    """获取所有留言（不包括回复）"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, text, img_url, lat, lng, created_at FROM comments ORDER BY created_at;"
    )
    rows = cur.fetchall()
    conn.close()

    comments = []
    for row in rows:
        comments.append({
            "id": row[0],
            "name": row[1],
            "text": row[2],
            "img_url": f"/static/{row[3]}" if row[3] else None,
            "lat": float(row[4]),
            "lng": float(row[5]),
            "created_at": row[6].strftime("%Y-%m-%d %H:%M:%S")
        })
    return comments

def add_comment(name, text, img_url, lat, lng):
    """添加留言"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO comments (name, text, img_url, lat, lng) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at;",
        (name, text, img_url, lat, lng)
    )
    result = cur.fetchone()
    conn.commit()
    conn.close()

    if result:
        return result[0], result[1].strftime("%Y-%m-%d %H:%M:%S")
    else:
        return None, None

def get_comment(comment_id):
    """获取单个留言（包含留言详情，但不包括回复）"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, text, img_url, lat, lng, created_at FROM comments WHERE id = %s;",
        (comment_id,)
    )
    row = cur.fetchone()
    conn.close()

    if row:
        return {
            "id": row[0],
            "name": row[1],
            "text": row[2],
            "img_url": f"/static/{row[3]}" if row[3] else None,
            "lat": float(row[4]),
            "lng": float(row[5]),
            "created_at": row[6].strftime("%Y-%m-%d %H:%M:%S")
        }
    else:
        return None

def get_replies(comment_id):
    """获取某条留言的所有回复"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, comment_id, name, text, img_url, created_at FROM replies WHERE comment_id = %s ORDER BY created_at;",
        (comment_id,)
    )
    rows = cur.fetchall()
    conn.close()

    replies = []
    for row in rows:
        replies.append({
            "id": row[0],
            "comment_id": row[1],
            "name": row[2],
            "text": row[3],
            "img_url": f"/static/{row[4]}" if row[4] else None,
            "created_at": row[5].strftime("%Y-%m-%d %H:%M:%S")
        })
    return replies

def add_reply(comment_id, name, text, img_url):
    """添加回复"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO replies (comment_id, name, text, img_url) VALUES (%s, %s, %s, %s) RETURNING id, created_at;",
        (comment_id, name, text, img_url)
    )
    result = cur.fetchone()
    conn.commit()
    conn.close()

    if result:
        return result[0], result[1].strftime("%Y-%m-%d %H:%M:%S")
    else:
        return None, None
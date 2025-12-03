from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, GlobalActivityLog

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({'error': 'Current user not found'}), 404

    # ✅ Admin: see everyone
    if getattr(current_user, "role", "") == "admin":
        rows = User.query.order_by(User.id.asc()).all()
    else:
        # ✅ Normal user: ONLY see themselves
        rows = [current_user]

    return jsonify([
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "gender": getattr(u, "gender", None),
            "hobbies": getattr(u, "hobbies", None),
        }
        for u in rows
    ]), 200

@users_bp.route('/global-logs', methods=['GET'])
@jwt_required()
def get_global_logs():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    logs = GlobalActivityLog.query.order_by(GlobalActivityLog.timestamp.desc()).limit(50).all()

    def safe_isoformat(dt):
        return dt.isoformat() if dt else None

    serialized_logs = []
    for l in logs:
        serialized_logs.append({
            'action': l.action,
            'user': l.user.username if l.user else 'Unknown',
            'timestamp': safe_isoformat(l.timestamp)
        })

    return jsonify(serialized_logs), 200

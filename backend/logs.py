# logs.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, GlobalActivityLog, User

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/global-logs', methods=['GET'])
@jwt_required()
def global_logs():
    current_user_id = get_jwt_identity()
    limit = request.args.get('limit', default=100, type=int)

    # All global logs created by THIS user (login, logout, tasks, projects, etc.)
    q = (
        GlobalActivityLog.query
        .filter_by(user_id=int(current_user_id))
        .order_by(GlobalActivityLog.timestamp.desc())  # adjust column name if needed
        .limit(limit)
    )

    logs = q.all()

    result = []
    for log in logs:
        user = getattr(log, "user", None)  # if you have relationship GlobalActivityLog.user
        username = user.username if user else None

        result.append({
            "id": log.id,
            "user": username,
            "action": log.action,
            "timestamp": log.timestamp.isoformat() if getattr(log, "timestamp", None) else None,
        })

    return jsonify(result), 200

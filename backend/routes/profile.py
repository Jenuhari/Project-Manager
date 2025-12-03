from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from models import db, User

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def manage_profile():
    current_user_id = get_jwt_identity()  # Returns str(user.id)
    user = User.query.get_or_404(int(current_user_id))  # Cast to int
    if request.method == 'GET':
        return jsonify({'username': user.username, 'email': user.email, 'role': user.role})
    elif request.method == 'PUT':
        data = request.get_json()
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        if 'password' in data:
            user.password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        db.session.commit()
        return jsonify({'message': 'Profile updated'})
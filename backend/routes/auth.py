# auth.py
import os
import re
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_mail import Message
import jwt

from models import db, User, GlobalActivityLog
from mail_config import mail

auth_bp = Blueprint("auth", __name__)

# ---------- FILE UPLOAD CONFIG ----------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_FOLDER = os.path.join(BASE_DIR, "..", "storage")
os.makedirs(STORAGE_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf", "xls", "xlsx", "csv"}
MIN_FILE_SIZE = 1 * 1024 * 1024  # 1 MB in bytes


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------- PASSWORD VALIDATION ----------

# 1st char: capital letter
# total length: 8–12
# allowed chars: letters + digits only
PASSWORD_REGEX = re.compile(r"^[A-Z][A-Za-z0-9]{7,11}$")


def validate_password(pwd: str) -> bool:
    if not pwd:
        return False
    return bool(PASSWORD_REGEX.match(pwd))


# ---------- SIGNUP ----------

@auth_bp.route("/signup", methods=["POST"])
def signup():
    # When sending multipart/form-data, fields come from request.form
    username = (request.form.get("username") or "").strip()
    email = (request.form.get("email") or "").strip().lower()
    password = request.form.get("password") or ""
    gender = (request.form.get("gender") or "").strip()
    # Frontend will send hobbies as comma-separated string
    hobbies_raw = request.form.get("hobbies")  # e.g. "movies,music"
    hobbies = hobbies_raw.strip() if hobbies_raw else None

    if not username or not email or not password:
        return jsonify({"message": "Missing required fields"}), 400

    # password rule: first letter capital, 8–12 chars, only letters/digits
    if not validate_password(password):
        return (
            jsonify(
                {
                    "message": (
                        "Password must start with a capital letter, "
                        "be 8–12 characters long, and contain only "
                        "letters and numbers (no special characters)."
                    )
                }
            ),
            400,
        )

    # Unique username / email
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    # ---------- FILE (DOCUMENT) HANDLING ----------
    document = request.files.get("document")
    document_path = None

    if document and document.filename:
        filename = secure_filename(document.filename)

        if not allowed_file(filename):
            return (
                jsonify(
                    {
                        "message": (
                            "Invalid file type. Allowed: jpg, jpeg, png, "
                            "pdf, xls, xlsx, csv"
                        )
                    }
                ),
                400,
            )

        # Check file size (must be >= 1 MB)
        # Use underlying stream for reliable size measurement
        document.stream.seek(0, os.SEEK_END)
        size_bytes = document.stream.tell()
        document.stream.seek(0)

        if size_bytes < MIN_FILE_SIZE:
            return (
                jsonify(
                    {
                        "message": (
                            "File must be at least 1 MB in size "
                            f"(uploaded ~{size_bytes / 1024:.0f} KB)."
                        )
                    }
                ),
                400,
            )

        # Make filename unique
        ts = int(datetime.utcnow().timestamp())
        unique_name = f"{ts}_{username}_{filename}"
        save_path = os.path.join(STORAGE_FOLDER, unique_name)
        document.save(save_path)

        document_path = save_path  # store full path or relative path

    # ---------- CREATE USER ----------
    hashed_pw = generate_password_hash(password, method="pbkdf2:sha256")

    user = User(
        username=username,
        email=email,
        password=hashed_pw,
        role="user",
        gender=gender,
        hobbies=hobbies,
        document_path=document_path,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created"}), 201


# ---------- LOGIN / LOGOUT (unchanged except for logs) ----------

# ---------- LOGIN / LOGOUT (unchanged except for logs) ----------

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))

    # Global log for login  ➜ use local time instead of UTC
    log = GlobalActivityLog(
        user_id=user.id,
        action="Logged in",
        timestamp=datetime.now()   # 👈 add this
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"token": token, "role": user.role}), 200





@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    current_user_id = int(get_jwt_identity())

    # Use the same IST time as in login
    now_ist = datetime.utcnow() + timedelta(hours=5, minutes=30)

    log = GlobalActivityLog(
        user_id=current_user_id,
        action="Logged out",
        timestamp=now_ist,          # 👈 important
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Logged out"}), 200



# ---------- FORGOT PASSWORD / RESET PASSWORD ----------

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    reset_token = jwt.encode(
        {"user_id": user.id, "exp": datetime.utcnow() + timedelta(minutes=15)},
        "your_reset_secret_key",
        algorithm="HS256",
    )

    msg = Message(
        subject="Password Reset Request",
        recipients=[email],
        body=(
            "Click the link to reset your password: "
            f"http://localhost:3000/reset-password?token={reset_token}"
        ),
    )

    try:
        mail.send(msg)
    except Exception as e:
        print("Error sending email:", e)
        return jsonify({"message": "Error sending email. Please try again."}), 500

    return jsonify({"message": "Password reset email sent"}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password") or ""

    # validate new password with same rules
    if not validate_password(new_password):
        return (
            jsonify(
                {
                    "message": (
                        "Password must start with a capital letter, "
                        "be 8–12 characters long, and contain only "
                        "letters and numbers (no special characters)."
                    )
                }
            ),
            400,
        )

    try:
        payload = jwt.decode(token, "your_reset_secret_key", algorithms=["HS256"])
        user_id = payload["user_id"]
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.password = generate_password_hash(new_password, method="pbkdf2:sha256")
    db.session.commit()

    return jsonify({"message": "Password reset successful"}), 200

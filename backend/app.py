import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from config import DATABASE_URL, JWT_SECRET_KEY, EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM, EMAIL_PORT, EMAIL_SERVER
from models import db
from mail_config import mail 
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.profile import profile_bp
from routes.users import users_bp
from routes.tasks import tasks_bp
from logs import logs_bp  


load_dotenv()

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', DATABASE_URL)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', JWT_SECRET_KEY)


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'hariharunsince92@gmail.com'
app.config['MAIL_PASSWORD'] = 'jicchdhwmdxzdbwz' 
app.config['MAIL_DEFAULT_SENDER'] = 'hariharunsince92@gmail.com'

db.init_app(app)
jwt = JWTManager(app)
CORS(app)


mail.init_app(app)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(projects_bp, url_prefix='/api')
app.register_blueprint(profile_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(tasks_bp, url_prefix='/api')
app.register_blueprint(logs_bp, url_prefix="/api")


with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)

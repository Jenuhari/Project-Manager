import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Hari%40200207@localhost:5432/project_manager_db')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', '17e5c1889e22c1710af4ad7b051f48bde05b6e42a60041aa1abb206af1761f9d')
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME', 'hariharunsince92@gmail.com')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', 'jicchdhwmdxzdbwz')  
EMAIL_FROM = os.getenv('EMAIL_FROM', 'hariharunsince92@gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_SERVER = os.getenv('EMAIL_SERVER', 'smtp.gmail.com')
RESET_SECRET_KEY = os.getenv('RESET_SECRET_KEY', 'your_reset_secret_key')

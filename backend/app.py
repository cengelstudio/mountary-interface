from flask import Flask
from flask_cors import CORS
import os
import sys
from app.socketio_instance import socketio

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes import register_routes

# Get the directory where this app.py file is located
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__,
    static_folder=os.path.join(basedir, 'static'),
    template_folder=os.path.join(basedir, 'templates')
)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:3000", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# SocketIO'yu Flask app'e bağla
socketio.init_app(app, cors_allowed_origins=["http://127.0.0.1:3000", "http://localhost:3000"], async_mode='threading')

# Register all routes
register_routes(app)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001, host='127.0.0.1')

from flask import Flask
from flask_cors import CORS
import os
import sys

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes import register_routes

# Get the directory where this app.py file is located
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__,
    static_folder=os.path.join(basedir, 'static'),
    template_folder=os.path.join(basedir, 'templates')
)
CORS(app)

# Register all routes
register_routes(app)

if __name__ == '__main__':
    app.run(debug=True, port=5001)

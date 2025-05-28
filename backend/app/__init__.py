from flask import Flask, render_template
from flask_cors import CORS
from .api.routes import api

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')

    @app.route('/')
    def home():
        return render_template('index.html')

    return app

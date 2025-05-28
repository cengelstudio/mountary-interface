from flask import render_template, jsonify, send_from_directory
import os

def is_build_available(app):
    """Check if React build files are available."""
    basedir = os.path.abspath(os.path.dirname(__file__))
    index_html = os.path.join(basedir, 'templates', 'index.html')
    static_dir = os.path.join(basedir, 'static')

    # Check if index.html exists and static directory has content
    return (os.path.exists(index_html) and
            os.path.exists(static_dir) and
            len(os.listdir(static_dir)) > 0)

def render_build_pending():
    """Render a build pending page when React build is not available."""
    html_content = """
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Track Interface - Build Bekleniyor</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }

            .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 500px;
                margin: 0 auto;
            }

            .icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
                font-weight: 600;
            }

            p {
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 1.5rem;
                opacity: 0.9;
            }

            .command {
                background: rgba(0, 0, 0, 0.3);
                padding: 1rem;
                border-radius: 10px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 1rem;
                margin: 1rem 0;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .steps {
                text-align: left;
                margin-top: 1.5rem;
            }

            .step {
                margin: 0.5rem 0;
                padding: 0.5rem 0;
            }

            .step-number {
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                width: 24px;
                height: 24px;
                border-radius: 50%;
                text-align: center;
                line-height: 24px;
                margin-right: 0.5rem;
                font-size: 0.9rem;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🏗️</div>
            <h1>Build Bekleniyor</h1>
            <p>React uygulaması henüz build edilmemiş. Lütfen aşağıdaki adımları takip edin:</p>

            <div class="steps">
                <div class="step">
                    <span class="step-number">1</span>
                    Terminal'i açın ve proje dizinine gidin
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    Build komutunu çalıştırın:
                </div>
            </div>

            <div class="command">python3 build.py</div>

            <div class="steps">
                <div class="step">
                    <span class="step-number">3</span>
                    Build tamamlandıktan sonra sayfayı yenileyin
                </div>
            </div>

            <p style="margin-top: 1.5rem; font-size: 0.9rem; opacity: 0.7;">
                Build işlemi frontend bağımlılıklarını yükleyecek ve React uygulamasını derleyecektir.
            </p>
        </div>
    </body>
    </html>
    """
    return html_content

def register_routes(app):
    """Register all routes with the Flask app."""

    @app.route('/')
    def index():
        if is_build_available(app):
            return render_template('index.html')
        else:
            return render_build_pending()

    @app.route('/static/<path:filename>')
    def serve_static(filename):
        if is_build_available(app):
            return send_from_directory(app.static_folder, filename)
        else:
            # Return 404 for static files when build is not available
            return "Build not available", 404

    @app.route('/api/hello')
    def hello():
        return jsonify({"message": "Hello from Flask!"})

    @app.route('/api/build-status')
    def build_status():
        """API endpoint to check build status."""
        return jsonify({
            "build_available": is_build_available(app),
            "message": "Build is ready" if is_build_available(app) else "Build pending"
        })

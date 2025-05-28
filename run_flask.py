import sys
from pathlib import Path
import importlib.util

# backend/app.py'nin tam yolunu al
app_path = Path(__file__).parent / "backend" / "app.py"
spec = importlib.util.spec_from_file_location("backend_app", app_path)
backend_app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_app)

if __name__ == "__main__":
    # Production için debug=False, development için debug=True
    backend_app.app.run(host="0.0.0.0", port=5001, debug=True)

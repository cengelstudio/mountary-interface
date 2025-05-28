# Mountary (Interface)
_Mountary = Mount + Inventory_

The web application part of a project designed for media companies to keep track of portable external drives (e.g., SSDs, HDDs, or SD cards), allowing remote monitoring of their content, specifications, and the last used computers.

## Architecture

- **Frontend**: React.js application with modern UI
- **Backend**: Flask API server
- **Build System**: Automated build and deployment pipeline

## Prerequisites

- Python 3.8+
- Node.js 16+
- Yarn package manager

##  Quick Start

### 1. Install Dependencies

**Backend dependencies:**
```bash
cd ./backend
pip install -r requirements.txt
```

**Frontend dependencies:**
```bash
cd frontend
yarn install
# or
npm install
```

### 2. Build and Run

**Option A: Automated Build (Recommended)**
```bash
# Build frontend and prepare backend
python3 build.py

# Start the Flask server
python3 run_flask.py
```

**Option B: Development Mode**
```bash
# Terminal 1: Start Flask backend
python3 run_flask.py

# Terminal 2: Start React development server
cd frontend
yarn start
```

### 3. Access the Application

- **Production Mode**: http://localhost:5001
- **Development Mode**:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:5001

## 🔧 Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `frontend/src/`
2. **Backend Changes**: Edit files in `backend/`
3. **Build for Production**: Run `python3 build.py`

### Build Process

The `build.py` script automatically:
- Installs frontend dependencies
- Builds React application for production
- Copies build files to Flask static/templates directories
- Organizes files for optimal Flask serving

### Project Structure

```
track-interface/
├── frontend/                 # React application
│   ├── src/                 # React source code
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                 # Flask application
│   ├── app.py              # Main Flask app
│   ├── static/             # Built frontend assets (auto-generated)
│   ├── templates/          # HTML templates (auto-generated)
│   └── requirements.txt    # Backend dependencies
├── build.py                # Automated build script
├── run_flask.py           # Flask server launcher
└── README.md              # This file
```

## API Endpoints

- `GET /` - Serve React application
- `GET /api/hello` - Test API endpoint
- `GET /static/<path>` - Serve static assets

## Notes

- Build files (`backend/static/`, `backend/templates/index.html`) are auto-generated
- These files are ignored by Git (see `.gitignore`)
- Always run `python3 build.py` after frontend changes for production deployment

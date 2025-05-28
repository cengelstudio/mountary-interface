#!/usr/bin/env python3
import os
import shutil
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(f"Error output: {e.stderr}")
        raise

def build_frontend():
    """Build the frontend application."""
    print("Building frontend application...")

    # Navigate to frontend directory
    frontend_dir = Path("frontend")

    # Install dependencies
    print("Installing dependencies...")
    run_command("yarn install", cwd=frontend_dir)

    # Build the application
    print("Building application...")
    run_command("yarn build", cwd=frontend_dir)

    # Create backend directories if they don't exist
    backend_static = Path("backend/static")
    backend_templates = Path("backend/templates")
    backend_static.mkdir(parents=True, exist_ok=True)
    backend_templates.mkdir(parents=True, exist_ok=True)

    # Copy build files to backend static directory
    print("Copying build files to backend...")
    build_dir = frontend_dir / "build"
    if build_dir.exists():
        # Remove existing static files if any
        if backend_static.exists():
            shutil.rmtree(backend_static)
        backend_static.mkdir(parents=True, exist_ok=True)

        # Copy index.html to templates directory
        index_html = build_dir / "index.html"
        if index_html.exists():
            shutil.copy2(index_html, backend_templates / "index.html")
            print("index.html copied to templates directory")

        # Copy static assets (js, css, etc.) to backend static directory
        build_static = build_dir / "static"
        if build_static.exists():
            # Copy contents of build/static to backend/static (flattening the structure)
            for item in build_static.iterdir():
                if item.is_dir():
                    shutil.copytree(item, backend_static / item.name, dirs_exist_ok=True)
                else:
                    shutil.copy2(item, backend_static)
            print("Static assets copied successfully!")

        # Copy other files from build directory (excluding index.html and static)
        for item in build_dir.iterdir():
            if item.name not in ["index.html", "static"]:
                if item.is_dir():
                    shutil.copytree(item, backend_static / item.name, dirs_exist_ok=True)
                else:
                    shutil.copy2(item, backend_static)

        print("Build files copied and organized successfully!")
    else:
        raise Exception("Build directory not found!")

def main():
    try:
        build_frontend()
        print("Build process completed successfully!")
    except Exception as e:
        print(f"Build process failed: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()

#!/bin/bash

# Frontend'i başlat
cd ./frontend && npm start &

# Backend'i başlat
cd ../backend && python app.py

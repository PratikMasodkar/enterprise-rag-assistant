#!/bin/bash

PROJECT_DIR="$HOME/Desktop/enterprise-rag"

cd "$PROJECT_DIR" || exit 1

# Start FastAPI
osascript -e 'tell application "Terminal" to do script "cd ~/Desktop/enterprise-rag && python3 -m uvicorn src.main:app --reload"'

# Wait for backend
sleep 3

# Start React
osascript -e 'tell application "Terminal" to do script "cd ~/Desktop/enterprise-rag/frontend && npm run dev"'

# Wait for frontend
sleep 5

# Open the application
open "http://localhost:5173"

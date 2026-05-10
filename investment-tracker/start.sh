#!/bin/bash
# Investment Tracker - Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check for .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "ERROR: ANTHROPIC_API_KEY not set."
        echo "Create a .env file from .env.example and add your Anthropic API key."
        exit 1
    fi
fi

echo "Starting Investment Tracker..."

# Backend
cd "$SCRIPT_DIR/backend"
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend
cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop."
wait

#!/bin/bash

echo "Starting SpotiQuiz..."
echo ""

echo "[1/2] Starting Backend (FastAPI on port 5000)..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

sleep 2

echo "[2/2] Starting Frontend (Vite on port 8080)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "SpotiQuiz is starting!"
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:5000"
echo "========================================"
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait

@echo off
echo Starting SpotiQuiz...
echo.

echo [1/2] Starting Backend (FastAPI on port 5000)...
start cmd /k "cd backend && python main.py"

timeout /t 2 /nobreak

echo [2/2] Starting Frontend (Vite on port 8080)...
start cmd /k "npm run dev"

echo.
echo ========================================
echo SpotiQuiz is starting!
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:5000
echo ========================================
echo.
pause

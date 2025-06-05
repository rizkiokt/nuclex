#!/bin/bash

# Function to stop background processes on script exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "Starting NucLex services..."

# Start backend
echo "Starting backend server..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
cd ..

# Keep script running and show logs
echo "Both services are running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait

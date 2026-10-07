#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Starting SHIVMANI HRMS Development Suite "
echo "=========================================="

# Check if docker is available
if command -v docker &> /dev/null; then
    echo "Starting SQL Server via Docker..."
    docker compose up -d sqlserver
    echo "Waiting 10 seconds for SQL Server initialization..."
    sleep 10
fi

echo "To run backend:"
echo "  cd backend"
echo "  pip install -r requirements.txt"
echo "  uvicorn app.main:app --reload --port 8000"

echo ""
echo "To run frontend:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"

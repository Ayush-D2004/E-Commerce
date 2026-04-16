#!/usr/bin/env bash
# Render startup script
# Run once on each deploy: applies DB migrations then boots uvicorn.
set -e

echo "--- Running Alembic migrations ---"
alembic upgrade head

echo "--- Starting Uvicorn ---"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

#!/usr/bin/env bash
# Render startup script
# Run once on each deploy: applies DB migrations then boots uvicorn.
set -e

echo "--- Applying DB migrations ---"
# Try to upgrade. If it fails (usually because tables were manually seeded),
# we stamp the DB as 'head' so Alembic knows it is up to date.
alembic upgrade head || alembic stamp head

echo "--- Starting Uvicorn ---"
export PYTHONUNBUFFERED=1
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:10000}

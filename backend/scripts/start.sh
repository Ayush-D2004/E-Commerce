#!/usr/bin/env bash
# Render startup script
# Run once on each deploy: applies DB migrations then boots uvicorn.
set -e

echo "--- Applying DB migrations ---"
if [ -z "${DATABASE_URL:-}" ]; then
	echo "ERROR: DATABASE_URL is not set. Add your Neon connection string in Render service Environment variables."
	exit 1
fi

# Try to upgrade. If it fails (usually because tables were manually seeded),
# we stamp the DB as 'head' so Alembic knows it is up to date.
if ! alembic upgrade head; then
	echo "--- Alembic upgrade failed, attempting alembic stamp head ---"
	alembic stamp head
fi

echo "--- Starting Uvicorn ---"
export PYTHONUNBUFFERED=1
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}

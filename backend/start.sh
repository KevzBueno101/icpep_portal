#!/usr/bin/env bash
set -o errexit

echo "[start.sh] Running migrations..."
python manage.py migrate --noinput

echo "[start.sh] Ensuring superadmin..."
python manage.py create_superadmin

echo "[start.sh] Migrating about documents to public raw delivery..."
python manage.py migrate_about_documents || echo "[start.sh]  (migrate_about_documents skipped/failed — continuing)"

echo "[start.sh] Starting daphne on 0.0.0.0:${PORT:-8000}"
exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application

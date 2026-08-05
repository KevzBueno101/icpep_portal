#!/usr/bin/env bash
set -o errexit

echo "[start.sh] Running migrations..."
python manage.py migrate --noinput

echo "[start.sh] Ensuring superadmin..."
python manage.py create_superadmin

echo "[start.sh] Starting daphne on 0.0.0.0:${PORT:-8000}"
exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application

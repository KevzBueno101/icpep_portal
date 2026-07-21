#!/usr/bin/env bash
set -o errexit

python manage.py migrate
python manage.py create_superadmin

exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
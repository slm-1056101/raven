#!/usr/bin/env sh
set -e

python manage.py makemigrations --noinput
python manage.py migrate --noinput
python manage.py seed_demo
DJANGO_SUPERUSER_PASSWORD=suwokono123 python manage.py createsuperuser --name suwokono --email admin@suwokono.com --no-input

exec python manage.py runserver 0.0.0.0:8000

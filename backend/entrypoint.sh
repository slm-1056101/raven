#!/usr/bin/env sh
set -e

python manage.py makemigrations --noinput
python manage.py migrate --noinput
python manage.py seed_demo
DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD:-suwokono123} python manage.py shell -c "import os; from core.models import User; email='admin@suwokono.com'; password=os.environ.get('DJANGO_SUPERUSER_PASSWORD','suwokono123'); u, _ = User.objects.get_or_create(email=email, defaults={'name':'Suwokono Admin','role':User.Role.SUPER_ADMIN,'status':User.Status.ACTIVE,'is_staff':True,'is_superuser':True}); u.name=u.name or 'Suwokono Admin'; u.role=User.Role.SUPER_ADMIN; u.status=User.Status.ACTIVE; u.is_staff=True; u.is_superuser=True; u.set_password(password); u.save()"

exec python manage.py runserver 0.0.0.0:8000

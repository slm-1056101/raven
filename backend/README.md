# Backend

This folder contains the Django backend for the Raven project.

Quick start
-----------

Run everything (Postgres + Django API) via Docker Compose from the repository root.

1) Start the stack:

  docker compose up -d --build

2) Seed demo data:

  docker compose exec backend python manage.py seed_demo

The backend will be available at:

  http://localhost:8000/

Environment
-----------

Docker Compose uses sensible defaults, but you can override values with environment variables:

- POSTGRES_DB (default: raven)
- POSTGRES_USER (default: raven)
- POSTGRES_PASSWORD (default: raven)
- DJANGO_DEBUG (default: 1)
- DJANGO_SECRET_KEY
- DJANGO_ALLOWED_HOSTS (default: localhost,127.0.0.1)
- CORS_ALLOWED_ORIGINS (default: http://localhost:5173)

Notes
-----

- This backend uses JWT authentication (SimpleJWT).
- If you change Python dependencies in `backend/requirements.txt`, rebuild:

  docker compose up -d --build

Swagger / OpenAPI
-----------------

- OpenAPI schema:

  http://localhost:8000/api/schema/

- Swagger UI:

  http://localhost:8000/api/docs/

In Swagger UI, click "Authorize" and paste a JWT access token (format: `Bearer <token>`).

To get a token:

  POST http://localhost:8000/api/auth/token/
  {"email":"admin@delka.test","password":"raven123"}

Demo credentials
----------------

Password for all demo users: `raven123`

- superadmin@raven.com
- admin@delka.test
- client@delka.test



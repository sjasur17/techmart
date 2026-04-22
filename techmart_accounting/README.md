# TechMart Savdo - Financial Accounting REST API

Production-ready backend for the Financial Accounting system of TechMart Savdo, a retail company based in Tashkent, Uzbekistan. Built with Django and Django REST Framework, and configured for deployment to Google Cloud Run.

## Architecture and Stack
- **Framework:** Python 3.11, Django 4.2 LTS, Django REST Framework 3.15
- **Database:** PostgreSQL (with `psycopg2-binary`)
- **Authentication:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
- **Deployment:** Dockerized for Google Cloud Run, Gunicorn WSGI server, WhiteNoise for static files.

## Prerequisites
- Docker & Docker Compose
- Or: Python 3.11+, PostgreSQL

## Quick Start (with Docker)

1. Clone the repository and navigate to the root directory `techmart_accounting`.
2. Create your local `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```
3. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
   *This starts the Django web server (port 8000), Postgres DB (port 5432), and pgAdmin (port 5050).*
4. Run migrations and seed data inside the container:
   ```bash
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py seed_data
   ```

*The API will be accessible at: http://localhost:8000/api/v1/*

## Manual Setup (without Docker)

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Setup the database (Ensure local PostgreSQL is running and update `.env` file with credentials):
   ```bash
   python manage.py migrate
   ```
4. Load initial data (Creates superuser and accounts/journal entries):
   ```bash
   python manage.py seed_data
   ```
5. Run the server:
   ```bash
   python manage.py runserver
   ```

## Running Tests

To run the complete test suite:
```bash
python manage.py test
```

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Enable debug mode (`True` or `False`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `DJANGO_SETTINGS_MODULE` | Active settings module e.g. `techmart_accounting.settings.local` |
| `POSTGRES_DB` | Postgres DB Name (for docker-compose) |
| `POSTGRES_USER` | Postgres User (for docker-compose) |
| `POSTGRES_PASSWORD` | Postgres Password (for docker-compose) |

## API Documentation

All endpoints are namespaced under `/api/v1/`.

| Endpoint | Method | Description | Auth Required |
| -------- | ------ | ----------- | ------------- |
| `/auth/login/` | POST | Login with email/password, returns JWT and user profile | None |
| `/auth/refresh/` | POST | Get new access token from refresh token | None |
| `/auth/logout/` | POST | Blacklist refresh token | Yes |
| `/auth/me/` | GET | Retrieve basic details of current user | Yes |
| `/auth/register/` | POST | Admin registers new users | Admin |
| `/accounts/` | GET | List all active accounts (supports `?type=`, `?is_active=`, `?search=`) | Yes |
| `/accounts/` | POST | Create a new account | Admin |
| `/accounts/{id}/` | GET, PUT, DELETE | Manage specific account details | Admin (PUT/DEL) |
| `/accounts/{id}/ledger/` | GET | Extract all ledger lines for particular account | Yes |
| `/journal/` | GET | List journal entries (supports `?is_posted=`, `?date_from=`, etc.) | Yes |
| `/journal/` | POST | Create journal entry WITH nested lines | Yes |
| `/journal/{id}/` | GET, PUT, DELETE | Manage journal entry (Unposted entries only for PUT/DEL) | Yes |
| `/journal/{id}/post/` | POST | Validate and POST journal entry (Updates balances atomically) | Yes |
| `/journal/{id}/unpost/` | POST | Reverse balance updates and set entry back to DRAFT | Admin |
| `/reports/trial-balance/` | GET | Retrieve Trial Balance of all accounts (debits vs credits) | Yes |
| `/reports/income-statement/` | GET | View company revenue vs expenses for date ranges | Yes |
| `/reports/balance-sheet/` | GET | Assets = Liabilities + Equity statement view | Yes |
| `/reports/trial-balance/export/` | GET | Export CSV representing Trial Balance output | Yes |
| `/reports/journal-entries/export/` | GET | Export exhaustive list of Entry Lines as CSV | Yes |
| `/dashboard/` | GET | Combined aggregated summary metrics and 5 latest entries | Yes |

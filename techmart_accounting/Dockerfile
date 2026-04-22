# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies (needed for psycopg2 and other packages)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first to leverage Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the whole project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port (Cloud Run defaults to 8080, but using 8000 as configured here)
EXPOSE 8000

# Run migrations, ensure admin exists, then start server using gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python create_admin.py && gunicorn techmart_accounting.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120"]

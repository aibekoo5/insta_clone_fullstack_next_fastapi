#!/bin/bash

# Ждем пока PostgreSQL будет готов
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 1
done

echo "PostgreSQL started"

# Применяем миграции
echo "Applying migrations..."
alembic upgrade head

# Запускаем приложение
echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
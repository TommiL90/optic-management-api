#!/bin/sh
set -e

echo "🚀 Starting optic-management-api..."

# Variables
MAX_RETRIES=30
RETRY_INTERVAL=2

# Función para verificar si PostgreSQL está listo
wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."

  retries=0
  until pg_isready -h db -U ${POSTGRES_USER:-optic_user} -d ${POSTGRES_DB:-optic_db} > /dev/null 2>&1; do
    retries=$((retries + 1))

    if [ $retries -ge $MAX_RETRIES ]; then
      echo "❌ PostgreSQL did not become ready in time"
      exit 1
    fi

    echo "  Attempt $retries/$MAX_RETRIES: PostgreSQL not ready, waiting ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
  done

  echo "✅ PostgreSQL is ready!"
}

# Función para ejecutar migrations
run_migrations() {
  echo "📦 Running database migrations..."

  if pnpm prisma:migrate:deploy; then
    echo "✅ Migrations applied successfully!"
  else
    echo "❌ Migration failed!"
    exit 1
  fi
}

# Ejecutar pasos de inicialización
# NOTA: postgresql-client ya está instalado en el Dockerfile
wait_for_postgres
run_migrations

echo "🎉 Initialization complete! Starting application..."
echo ""

# Ejecutar comando principal (pasado como argumentos)
exec "$@"


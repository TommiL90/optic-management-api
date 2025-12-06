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

# Función para ejecutar seed (idempotente con upsert)
run_seed() {
  echo "🌱 Running database seed..."

  if pnpm prisma:seed; then
    echo "✅ Seed completed successfully!"
  else
    echo "⚠️  Seed failed, but continuing (data may already exist)"
  fi
}

# Instalar postgresql-client para pg_isready (solo si no existe)
if ! command -v pg_isready > /dev/null 2>&1; then
  echo "📥 Installing postgresql-client..."
  apk add --no-cache postgresql-client
fi

# Ejecutar pasos de inicialización
wait_for_postgres
run_migrations
run_seed

echo "🎉 Initialization complete! Starting application..."
echo ""

# Ejecutar comando principal (pasado como argumentos)
exec "$@"

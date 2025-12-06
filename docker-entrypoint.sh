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

# Función para esperar a que la API esté lista
wait_for_api() {
  echo "⏳ Waiting for API to be ready..."

  retries=0
  until curl -f http://localhost:3000/health > /dev/null 2>&1; do
    retries=$((retries + 1))

    if [ $retries -ge $MAX_RETRIES ]; then
      echo "❌ API did not become ready in time"
      exit 1
    fi

    echo "  Attempt $retries/$MAX_RETRIES: API not ready, waiting ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
  done

  echo "✅ API is ready!"
}

# Función para ejecutar seed de prescription ranges
run_seed_prescription_ranges() {
  echo "🌱 Running prescription ranges seed..."

  # JSON con los rangos de prescripción
  SEED_DATA='{
    "ranges": [
      {
        "code": "42-42",
        "description": "Ambos ojos hasta 4 esf / 2 cyl",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 2.0,
        "maxEyeMaxSphere": 4.0,
        "maxEyeMaxCylinder": 2.0
      },
      {
        "code": "42-44",
        "description": "Un ojo hasta 4/2, otro ojo hasta 4/4 (orden independiente)",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 2.0,
        "maxEyeMaxSphere": 4.0,
        "maxEyeMaxCylinder": 4.0
      },
      {
        "code": "ODI-44",
        "description": "Ambos ojos hasta 4 esf / 4 cyl",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 4.0,
        "maxEyeMaxSphere": 4.0,
        "maxEyeMaxCylinder": 4.0
      },
      {
        "code": "44-46",
        "description": "Un ojo hasta 4/4, otro ojo hasta 4/6 (orden independiente)",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 4.0,
        "maxEyeMaxSphere": 4.0,
        "maxEyeMaxCylinder": 6.0
      },
      {
        "code": "ODI-46",
        "description": "Ambos ojos hasta 4/6",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 6.0,
        "maxEyeMaxSphere": 4.0,
        "maxEyeMaxCylinder": 6.0
      },
      {
        "code": "44-66",
        "description": "Un ojo hasta 4/4, otro ojo hasta 6/6 (orden independiente)",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 4.0,
        "maxEyeMaxSphere": 6.0,
        "maxEyeMaxCylinder": 6.0
      },
      {
        "code": "ODI-62",
        "description": "Ambos ojos hasta 6/2",
        "minEyeMaxSphere": 6.0,
        "minEyeMaxCylinder": 2.0,
        "maxEyeMaxSphere": 6.0,
        "maxEyeMaxCylinder": 2.0
      },
      {
        "code": "62-42",
        "description": "Un ojo hasta 6/2, otro ojo hasta 4/2 (orden independiente)",
        "minEyeMaxSphere": 4.0,
        "minEyeMaxCylinder": 2.0,
        "maxEyeMaxSphere": 6.0,
        "maxEyeMaxCylinder": 2.0
      },
      {
        "code": "ODI-66",
        "description": "Ambos ojos hasta 6/6",
        "minEyeMaxSphere": 6.0,
        "minEyeMaxCylinder": 6.0,
        "maxEyeMaxSphere": 6.0,
        "maxEyeMaxCylinder": 6.0
      }
    ]
  }'

  if curl -X POST http://localhost:3000/prescription-ranges/seed \
    -H "Content-Type: application/json" \
    -d "$SEED_DATA" \
    -f -s > /dev/null 2>&1; then
    echo "✅ Prescription ranges seed completed successfully!"
  else
    echo "⚠️  Prescription ranges seed failed, but continuing (data may already exist)"
  fi
}

# Ejecutar pasos de inicialización
# NOTA: postgresql-client ya está instalado en el Dockerfile
wait_for_postgres
run_migrations

echo "🎉 Initialization complete! Starting application..."
echo ""

# Iniciar aplicación en background
"$@" &
APP_PID=$!

# Configurar trap para propagar señales al proceso de la app
trap "kill -TERM $APP_PID" TERM INT

# Esperar a que la API esté lista
wait_for_api

# Ejecutar seed de prescription ranges
run_seed_prescription_ranges

# Esperar a que el proceso de la aplicación termine y propagar su código de salida
wait $APP_PID
EXIT_CODE=$?
exit $EXIT_CODE


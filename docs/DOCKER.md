# Docker Configuration - Quick Reference

## Archivos de Configuración Docker

Este proyecto incluye configuración completa para deployment en producción optimizada para **VPS con 512MB RAM**.

### Archivos Principales

```
/Dockerfile              # Multi-stage build con Node.js 24 Alpine
/docker-compose.yml      # Orquestación con límites de recursos
/.dockerignore           # Optimización de build context
/docker-entrypoint.sh    # Inicialización (migrations automáticas)
/.env.production         # Plantilla de variables de entorno
```

## Desarrollo Local con Docker

### Levantar Servicios Localmente

```bash
# 1. Copiar plantilla de variables
cp .env.production .env

# 2. Editar .env y configurar passwords
nano .env

# 3. Construir imágenes
docker-compose build

# 4. Levantar servicios
docker-compose up -d

# 5. Ver logs
docker-compose logs -f

# 6. Verificar health
curl http://localhost:3000/health
```

### Detener Servicios

```bash
# Detener sin eliminar volúmenes (datos persisten)
docker-compose down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose down -v
```

## Build de Producción

### Construcción Manual

```bash
# Build de imagen de producción
docker build -t optic-management-api:latest .

# Verificar tamaño de imagen
docker images | grep optic-management-api

# Esperado: ~120-150MB (Alpine multi-stage)
```

### Stages del Build

1. **Builder Stage** (node:24-alpine):
   - Instala todas las dependencias
   - Genera Prisma Client
   - Ejecuta build con tsup
   - Tamaño: ~250MB (descartado)

2. **Production Stage** (node:24-alpine):
   - Solo dependencias de producción
   - Build compilado (CJS)
   - Prisma Client generado
   - Usuario no-root
   - Tamaño final: ~120-150MB

## Recursos Asignados

### PostgreSQL (150MB límite)
```yaml
CPU: 0.3 cores (30%)
RAM: 128MB reservados, 150MB máximo
Configuración:
  - max_connections: 5
  - shared_buffers: 32MB
  - work_mem: 2MB
```

### API Node.js (128MB límite)
```yaml
CPU: 0.3 cores (30%)
RAM: 100MB reservados, 128MB máximo
Node.js heap: 96MB (NODE_OPTIONS)
Prisma pool: 3 conexiones
```

## Variables de Entorno

### Variables Requeridas

```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=warn
LOG_PRETTY=false

# Database
POSTGRES_USER=optic_user
POSTGRES_PASSWORD=[CAMBIAR]
POSTGRES_DB=optic_db
DATABASE_URL=postgresql://[USER]:[PASS]@db:5432/[DB]?schema=public&connection_limit=3&pool_timeout=20

# Optional
API_PORT=3000
```

### Generar Password Seguro

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: pwgen
pwgen -s 32 1

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Health Checks

### Health Check de la API

```bash
# Endpoint nativo de la aplicación
curl http://localhost:3000/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2024-12-06T10:30:00.000Z"
}
```

### Health Check de PostgreSQL

```bash
# Desde host
docker exec optic-db pg_isready -U optic_user -d optic_db

# Respuesta esperada:
/var/run/postgresql:5432 - accepting connections
```

### Health Checks de Docker

Ambos servicios tienen health checks configurados:
- **API**: HTTP GET a `/health` cada 30s
- **PostgreSQL**: `pg_isready` cada 10s

Ver estado:
```bash
docker ps
# CONTAINER   STATUS
# optic-api   Up 5 minutes (healthy)
# optic-db    Up 5 minutes (healthy)
```

## Comandos Útiles

### Desarrollo

```bash
# Rebuild forzado
docker-compose build --no-cache

# Recrear contenedores
docker-compose up -d --force-recreate

# Ver logs en vivo
docker-compose logs -f api
docker-compose logs -f db

# Entrar a contenedor (debugging)
docker exec -it optic-api sh
docker exec -it optic-db psql -U optic_user optic_db
```

### Producción

```bash
# Ver uso de recursos
docker stats optic-api optic-db

# Verificar migrations
docker exec optic-api pnpm prisma:migrate:status

# Ejecutar seed manualmente
docker exec optic-api pnpm prisma:seed

# Backup de base de datos
docker exec optic-db pg_dump -U optic_user optic_db > backup.sql

# Restaurar backup
cat backup.sql | docker exec -i optic-db psql -U optic_user optic_db
```

## Optimizaciones

### .dockerignore

Reduce el build context de ~50MB a ~5MB excluyendo:
- `node_modules` (se instalan en build)
- `build` (se genera en build)
- Tests y coverage
- Documentación
- Archivos de editor

### Multi-stage Build

- **Stage 1 (builder)**: Compila aplicación (~250MB)
- **Stage 2 (production)**: Runtime mínimo (~120MB)
- **Ahorro**: ~130MB (~52% reducción)

### Node.js Alpine

- **node:24-alpine**: ~40MB base
- **node:24-slim**: ~180MB base
- **Ahorro**: ~140MB (~78% reducción)

## Troubleshooting

### Build falla en Prisma Generate

**Error**: `prisma generate failed`

**Solución**:
```bash
# Limpiar cache de Docker
docker builder prune -a

# Rebuild sin cache
docker-compose build --no-cache
```

### Contenedor no arranca

**Error**: `Container exited with code 1`

**Solución**:
```bash
# Ver logs completos
docker logs optic-api

# Verificar variables de entorno
docker exec optic-api env | grep -E "(DATABASE|NODE|PORT)"

# Verificar que PostgreSQL está listo
docker logs optic-db | grep "ready to accept connections"
```

### Out of Memory (OOM)

**Error**: `JavaScript heap out of memory`

**Solución**:
1. Reducir `NODE_OPTIONS` a `--max-old-space-size=80`
2. Reducir `connection_limit` a `2` en DATABASE_URL
3. Verificar que no hay memory leaks con `docker stats`

## Referencias

- **Deployment Guide**: Ver `docs/DEPLOY.md` para guía completa de Dokploy
- **Dockerfile**: Multi-stage build con Node.js 24 Alpine
- **docker-compose.yml**: Configuración de servicios con límites
- **docker-entrypoint.sh**: Script de inicialización (migrations automáticas)

## Arquitectura

```
┌─────────────────────────────────────────┐
│          Dockerfile (Multi-stage)       │
├─────────────────────────────────────────┤
│  Stage 1: Builder                       │
│  - node:24-alpine                       │
│  - Install all dependencies             │
│  - Generate Prisma Client               │
│  - Build with tsup                      │
│  - Size: ~250MB (discarded)             │
├─────────────────────────────────────────┤
│  Stage 2: Production                    │
│  - node:24-alpine                       │
│  - Only prod dependencies               │
│  - Copy build from builder              │
│  - Copy Prisma Client from builder      │
│  - Non-root user (nodejs:1001)          │
│  - Size: ~120-150MB (final)             │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│      docker-compose.yml                 │
├─────────────────────────────────────────┤
│  Service: db (PostgreSQL 16 Alpine)     │
│  - 150MB RAM limit                      │
│  - max_connections=5                    │
│  - Volume: postgres_data                │
├─────────────────────────────────────────┤
│  Service: api (Built from Dockerfile)   │
│  - 128MB RAM limit                      │
│  - Node heap: 96MB                      │
│  - Depends on: db (health check)        │
│  - Network: optic_network               │
└─────────────────────────────────────────┘
```

# Docker Configuration

Este proyecto tiene **3 configuraciones de Docker** para diferentes entornos:

## Archivos Docker

```
/Dockerfile                   # Build para producción (multi-stage, Node.js 24 Alpine)
/docker-compose.yml           # PostgreSQL para tests E2E (puerto 5432 mapeado)
/docker-compose.prod.yml      # Producción completa (API + PostgreSQL, para Dokploy)
/docker-compose.dev.yml       # (Opcional) Desarrollo local completo
/.dockerignore                # Optimización de build context
/docker-entrypoint.sh         # Script de inicialización (migrations automáticas)
```

## Uso por Entorno

### 1. Tests E2E (docker-compose.yml)

**Propósito**: Levantar solo PostgreSQL para tests de integración

```bash
# Levantar PostgreSQL para tests
docker-compose up -d

# Ejecutar tests E2E
pnpm test:e2e

# Detener
docker-compose down
```

**Características**:
- Solo PostgreSQL 16 Alpine
- Puerto 5432 mapeado a localhost
- Usuario: `docker`, Password: `docker`, DB: `ignitenode03`
- 256MB RAM límite
- No persiste datos (se limpia en cada test)

### 2. Producción (docker-compose.prod.yml)

**Propósito**: Deployment completo en Dokploy (VPS 512MB RAM)

```bash
# Build y levantar servicios de producción
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener
docker-compose -f docker-compose.prod.yml down
```

**Características**:
- API Node.js + PostgreSQL
- Límites estrictos de recursos (ver docs/DEPLOY.md)
- Variables desde `.env` (no incluido en git)
- Red privada interna
- Health checks configurados
- Volúmenes persistentes

**IMPORTANTE**: Este archivo se usa en Dokploy. Ver `docs/DEPLOY.md` para guía completa.

### 3. Desarrollo Local (docker-compose.dev.yml) - OPCIONAL

Si quieres desarrollo local con hot-reload, puedes crear este archivo:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    container_name: optic-dev-db
    ports:
      - "5433:5432"  # Puerto diferente para no chocar con tests
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: optic_dev
    volumes:
      - dev_postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  # Usar stage de builder (incluye dev dependencies)
    container_name: optic-dev-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://dev:dev@db:5432/optic_dev
    volumes:
      - ./src:/app/src  # Hot reload
      - ./prisma:/app/prisma
    command: pnpm start:dev
    depends_on:
      - db

volumes:
  dev_postgres_data:
```

## Configuración para Dokploy

Para deployment en Dokploy:

1. Dokploy usa `docker-compose.prod.yml` automáticamente
2. Configurar variables de entorno en Dokploy UI
3. Ver documentación completa en `docs/DEPLOY.md`

## Comandos Útiles

```bash
# Tests E2E
docker-compose up -d                    # Levantar PostgreSQL para tests
pnpm test:e2e                           # Ejecutar tests
docker-compose down                     # Detener

# Producción (local)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml down

# Ver recursos
docker stats

# Limpiar todo
docker-compose down -v
docker-compose -f docker-compose.prod.yml down -v
```

## Resumen

| Archivo | Entorno | Servicios | Puerto | Uso |
|---------|---------|-----------|--------|-----|
| `docker-compose.yml` | Tests | PostgreSQL | 5432 | `pnpm test:e2e` |
| `docker-compose.prod.yml` | Producción | API + PostgreSQL | 3000 | Dokploy |
| `docker-compose.dev.yml` | Desarrollo | API + PostgreSQL | 3000, 5433 | Opcional |

## Más Información

- **Deployment**: Ver `docs/DEPLOY.md`
- **Docker Reference**: Ver `docs/DOCKER.md`
- **Troubleshooting**: Ver `docs/DEPLOY.md` sección "Troubleshooting"

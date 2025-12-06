# Deployment en Dokploy (VPS 512MB RAM)

## Pre-requisitos

- VPS con **512MB RAM** (Oracle Free Tier, Hetzner Cloud CX11, etc.)
- Dokploy instalado y configurado
- Dominio apuntando al VPS (opcional, Traefik puede usar IP)
- Git instalado en el VPS

## Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────┐
│                     VPS (512MB RAM)                     │
├─────────────────────────────────────────────────────────┤
│  Traefik (Dokploy)     │  ~60-80MB    │  Reverse Proxy │
│  PostgreSQL 16 Alpine  │  ~128-150MB  │  Database      │
│  API Node.js 24        │  ~100-128MB  │  Fastify App   │
│  Sistema + Docker      │  ~60-80MB    │  Overhead      │
├─────────────────────────────────────────────────────────┤
│  TOTAL ESTIMADO        │  ~348-438MB  │  72-164MB libre│
└─────────────────────────────────────────────────────────┘
```

## Pasos de Deployment

### 1. Preparar Repositorio

Asegurar que los siguientes archivos existen en la raíz del repositorio:

```bash
/Dockerfile                 # Multi-stage build con Node.js 24 Alpine
/docker-compose.prod.yml    # Orquestación de servicios con límites de recursos (PRODUCCIÓN)
/.dockerignore              # Optimización de contexto de build
/docker-entrypoint.sh       # Inicialización automática (migrations)
/.env.production            # Plantilla de variables de entorno

# NOTA: docker-compose.yml es para tests E2E locales, NO para Dokploy
```

**Verificar archivos**:
```bash
ls -la Dockerfile docker-compose.prod.yml .dockerignore docker-entrypoint.sh .env.production
```

**Commit y push a repositorio**:
```bash
git add Dockerfile docker-compose.prod.yml .dockerignore docker-entrypoint.sh .env.production README.docker.md
git commit -m "feat: add Docker deployment configuration for Dokploy"
git push origin main
```

### 2. Configurar Aplicación en Dokploy

#### A. Login a Dokploy
```
https://tu-vps-ip:3000
```

#### B. Crear Nuevo Proyecto
1. Click en **"Create Project"**
2. Nombre: `optic-management-api`
3. Tipo: **"Docker Compose"**
4. Click en **"Create"**

#### C. Configurar Repositorio
1. En la sección **"Source"**:
   - **Repository URL**: `https://github.com/tu-usuario/optic-management-api.git`
   - **Branch**: `main`
   - **Path**: `/` (raíz del repositorio)
   - **Docker Compose File**: `docker-compose.prod.yml` ⚠️ IMPORTANTE: usar `.prod.yml`

2. Click en **"Save"**

#### D. Configurar Variables de Entorno

En la sección **"Environment Variables"** de Dokploy, agregar:

```bash
# Node.js Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=warn
LOG_PRETTY=false

# PostgreSQL Database (CAMBIAR PASSWORD)
POSTGRES_USER=optic_user
POSTGRES_PASSWORD=[GENERAR_PASSWORD_SEGURO_AQUÍ]
POSTGRES_DB=optic_db

# Database URL (CAMBIAR PASSWORD POR EL MISMO DE ARRIBA)
DATABASE_URL=postgresql://optic_user:[MISMO_PASSWORD]@db:5432/optic_db?schema=public&connection_limit=3&pool_timeout=20

# Docker Compose
API_PORT=3000
```

**IMPORTANTE**:
- Reemplazar `[GENERAR_PASSWORD_SEGURO_AQUÍ]` y `[MISMO_PASSWORD]` con un password seguro generado
- Puedes generar un password seguro con: `openssl rand -base64 32`

#### E. Configurar Traefik (Routing)

1. En la sección **"Domains"** o **"Traefik"**:
   - **Habilitar Traefik**: ✅ Sí
   - **Host**: `api.tu-dominio.com` (o usar IP directa)
   - **Puerto interno**: `3000`
   - **HTTPS**: ✅ Sí (Let's Encrypt automático)
   - **Redirect HTTP → HTTPS**: ✅ Sí

2. Click en **"Save"**

### 3. Ejecutar Deploy

1. Click en **"Deploy"** o **"Redeploy"**

2. **Proceso esperado** (5-10 minutos):
   ```
   ┌─ Clone del repositorio               (~30s)
   ├─ Build de imagen Docker              (~3-5 min)
   ├─ Pull de PostgreSQL Alpine           (~1 min)
   ├─ Inicio de servicios                 (~30s)
   ├─ Migrations automáticas              (~30s)
   ├─ Health checks (API + DB)            (~20s)
   └─ Traefik routing configurado         (~10s)
   ```

3. **Monitorear logs** en la interfaz de Dokploy:
   ```
   🚀 Starting optic-management-api...
   ⏳ Waiting for PostgreSQL to be ready...
   ✅ PostgreSQL is ready!
   📦 Running database migrations...
   ✅ Migrations applied successfully!
   🎉 Initialization complete! Starting application...
   🚀 Server running at http://0.0.0.0:3000
   ```
   
   **NOTA**: El seed no se ejecuta automáticamente. Si necesitas ejecutarlo, hazlo manualmente.

### 4. Verificación

#### A. Health Check
```bash
curl https://api.tu-dominio.com/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2024-12-06T10:30:00.000Z"
}
```

#### B. Swagger UI
- URL: `https://api.tu-dominio.com/docs`
- Deberías ver la documentación interactiva de la API
- Si seed corrió correctamente, habrá 13 productos de lentes y 8 rangos de prescripción

#### C. Verificar Servicios
```bash
# SSH al VPS
ssh usuario@tu-vps-ip

# Ver contenedores corriendo
docker ps

# Esperado:
# CONTAINER ID   IMAGE                           STATUS         PORTS
# abc123...      optic-api                       Up 5 minutes   0.0.0.0:3000->3000/tcp
# def456...      postgres:16-alpine              Up 5 minutes   5432/tcp
```

## Monitoreo de Recursos

### Verificar Uso de RAM

#### Dentro del VPS (SSH)
```bash
# Ver uso de RAM por contenedor en tiempo real
docker stats

# Esperado:
# CONTAINER     CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
# optic-api     0.5%      85MB / 128MB          66%       10MB / 5MB
# optic-db      0.3%      120MB / 150MB         80%       5MB / 10MB
```

#### Uso total de memoria
```bash
free -h

# Esperado:
#               total        used        free
# Mem:          512Mi        380Mi       132Mi
```

**Interpretación**:
- **Uso < 90%**: ✅ Todo bien, margen de seguridad adecuado
- **Uso 90-95%**: ⚠️ Considerar aplicar optimizaciones opcionales
- **Uso > 95%**: 🚨 Aplicar optimizaciones urgentemente (ver sección más abajo)

### Logs de OOM (Out of Memory)

```bash
# Verificar si el OOM Killer ha matado procesos
dmesg | grep -i "out of memory"

# Si aparece algo: significa que se quedó sin RAM
# Aplicar optimizaciones de la sección "Optimizaciones Opcionales"
```

### Alertas de Problemas

**Señales de problemas de RAM**:
- API responde con 502/503 (Bad Gateway/Service Unavailable)
- Logs muestran: `JavaScript heap out of memory`
- Contenedores reiniciándose constantemente
- `docker stats` muestra MEM % constantemente > 90%

## Optimizaciones Opcionales

Aplicar estas optimizaciones **solo si** el uso de RAM es crítico (>90%).

### Optimización A: Deshabilitar Swagger en Producción

**Ahorro estimado**: 10-15MB RAM

1. Editar `src/app.ts` (línea ~96):
   ```typescript
   // Antes:
   app.register(swaggerPlugin);

   // Después:
   if (env.NODE_ENV === 'development') {
     app.register(swaggerPlugin);
   }
   ```

2. Commit y redeploy:
   ```bash
   git add src/app.ts
   git commit -m "perf: disable Swagger in production to save RAM"
   git push origin main
   ```

3. En Dokploy: Click en **"Redeploy"**

### Optimización B: Reducir Logging

**Ahorro estimado**: 5-8MB RAM

1. En Dokploy, cambiar variable de entorno:
   ```bash
   LOG_LEVEL=error  # en vez de "warn"
   ```

2. Click en **"Save"** y **"Redeploy"**

### Optimización C: Reducir Connection Pool de Prisma

**Ahorro estimado**: 5-10MB RAM

1. En Dokploy, editar `DATABASE_URL`:
   ```bash
   # Antes:
   DATABASE_URL=postgresql://...?connection_limit=3&pool_timeout=20

   # Después:
   DATABASE_URL=postgresql://...?connection_limit=2&pool_timeout=20
   ```

2. Click en **"Save"** y **"Redeploy"**

### Optimización D: Reducir Heap de Node.js

**Ahorro estimado**: 10-15MB RAM

1. En `docker-compose.yml`, editar línea de `NODE_OPTIONS`:
   ```yaml
   # Antes:
   NODE_OPTIONS: "--max-old-space-size=96"

   # Después:
   NODE_OPTIONS: "--max-old-space-size=80"
   ```

2. Commit y redeploy:
   ```bash
   git add docker-compose.yml
   git commit -m "perf: reduce Node.js heap size to 80MB"
   git push origin main
   ```

## Troubleshooting

### Problema: Migration falla

**Error en logs**:
```
❌ Migration failed!
Error: P1001: Can't reach database server
```

**Solución**:
1. Verificar que PostgreSQL está corriendo:
   ```bash
   docker ps | grep postgres
   ```

2. Verificar health check:
   ```bash
   docker exec optic-db pg_isready -U optic_user -d optic_db
   ```

3. Verificar que `DATABASE_URL` es correcto:
   - Host debe ser `db` (nombre del servicio en docker-compose)
   - User/Password deben coincidir con `POSTGRES_USER` y `POSTGRES_PASSWORD`

### Problema: Seed necesario

**Nota**: El seed ya no se ejecuta automáticamente. Si necesitas ejecutarlo:

**Solución**:
```bash
# Ejecutar seed manualmente
docker exec optic-api pnpm prisma:seed
```

### Problema: API no arranca

**Error en logs**:
```
Error starting server
```

**Solución**:
1. Verificar logs completos:
   ```bash
   docker logs optic-api --tail 100
   ```

2. Causas comunes:
   - **`DATABASE_URL` incorrecto**: Verificar formato y credenciales
   - **PostgreSQL no disponible**: Verificar `docker ps` y health check
   - **Puerto 3000 ocupado**: Cambiar `API_PORT` en variables de entorno
   - **Migrations fallaron**: Ver logs de migrations

### Problema: Contenedor crashea con OOM

**Error en `dmesg`**:
```
Out of memory: Killed process 1234 (node)
```

**Solución**:
1. Aplicar **Optimización D** (reducir heap a 80MB)
2. Si persiste, aplicar **Optimización A** (deshabilitar Swagger)
3. Si aún persiste, aplicar **Optimización C** (reducir connection pool a 2)

### Problema: Build timeout en Dokploy

**Error**:
```
Build failed: timeout after 30 minutes
```

**Solución**:
1. Verificar que `.dockerignore` existe y excluye `node_modules`
2. Verificar conexión a internet del VPS (npm packages)
3. En casos extremos, aumentar timeout en configuración de Dokploy

## Re-deploys (Cambios de Código)

### Workflow de Re-deploy

1. **Hacer cambios en el código**:
   ```bash
   # Ejemplo: agregar nuevo endpoint
   git add .
   git commit -m "feat: add new endpoint for lens filters"
   git push origin main
   ```

2. **Trigger deploy en Dokploy**:
   - **Automático**: Si webhook está configurado, deploy inicia automáticamente
   - **Manual**: Click en **"Redeploy"** en la UI de Dokploy

3. **Verificar deploy**:
   - Monitorear logs en Dokploy UI
   - Verificar health check: `curl https://api.dominio.com/health`
   - Probar cambios en Swagger o con curl

### Downtime Durante Re-deploys

**Limitación**: Con 512MB RAM, es difícil tener 2 versiones corriendo simultáneamente (zero-downtime).

**Proceso actual**:
1. Dokploy detiene contenedores viejos
2. Construye nueva imagen (~3-5 min)
3. Inicia nuevos contenedores (~30s)
4. **Downtime estimado**: ~30-60 segundos

**Para minimizar downtime**:
- Health checks rápidos (ya optimizados)
- `restart: unless-stopped` (ya configurado)
- Hacer deploys en horarios de bajo tráfico

## Backup de Base de Datos

### Crear Backup Manual

```bash
# SSH al VPS
ssh usuario@tu-vps-ip

# Crear backup
docker exec optic-db pg_dump -U optic_user optic_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backup_*.sql
```

### Backup Automático (Cron Job)

```bash
# Editar crontab
crontab -e

# Agregar línea (backup diario a las 2 AM)
0 2 * * * docker exec optic-db pg_dump -U optic_user optic_db > /home/usuario/backups/backup_$(date +\%Y\%m\%d).sql

# Guardar y salir
```

### Restaurar Backup

```bash
# Restaurar desde backup
cat backup_20241206_140000.sql | docker exec -i optic-db psql -U optic_user optic_db

# Verificar datos restaurados
docker exec optic-db psql -U optic_user optic_db -c "SELECT COUNT(*) FROM \"User\";"
```

## Rollback de Deploys

### Rollback en Dokploy UI

1. En la sección **"Deployments"**
2. Encontrar el deployment anterior exitoso
3. Click en **"Rollback to this version"**

### Rollback Manual

```bash
# SSH al VPS
ssh usuario@tu-vps-ip

# Detener servicios
cd /path/to/project
docker-compose down

# Revertir a commit anterior
git log --oneline  # Ver commits
git checkout abc123  # Revertir a commit específico

# Reconstruir y reiniciar
docker-compose build
docker-compose up -d

# Verificar
docker ps
curl http://localhost:3000/health
```

## Monitoreo Continuo

### Configurar Alertas (Opcional)

**Uptime Monitoring**:
- [UptimeRobot](https://uptimerobot.com/) (gratis, 50 monitores)
- [Pingdom](https://www.pingdom.com/) (plan gratis limitado)
- Configurar checks cada 5 minutos a `https://api.dominio.com/health`

**Resource Monitoring**:
- Instalar `node_exporter` en VPS para Prometheus
- Usar Grafana Cloud (gratis) para dashboards
- Alertas automáticas si RAM > 90% o API down

### Logs de Aplicación

**Ver logs en tiempo real**:
```bash
# Logs de API
docker logs -f optic-api

# Logs de PostgreSQL
docker logs -f optic-db

# Logs de todos los servicios
docker-compose logs -f
```

**Filtrar logs**:
```bash
# Solo errores
docker logs optic-api 2>&1 | grep -i error

# Últimas 100 líneas
docker logs --tail 100 optic-api

# Desde timestamp
docker logs --since 2024-12-06T10:00:00 optic-api
```

## Seguridad

### Checklist de Seguridad

- [ ] **Passwords seguros**: No usar passwords por defecto
- [ ] **HTTPS habilitado**: Let's Encrypt configurado en Traefik
- [ ] **Firewall**: Solo puertos 80, 443, 22 abiertos
- [ ] **SSH key authentication**: Deshabilitar password SSH
- [ ] **Backups regulares**: Cron job configurado
- [ ] **Variables de entorno**: No commitear `.env` con valores reales
- [ ] **Usuario no-root**: Contenedor corre como `nodejs:1001`
- [ ] **Dependencias actualizadas**: `pnpm update` regularmente

### Actualizar Dependencias

```bash
# Actualizar dependencias
pnpm update

# Verificar vulnerabilidades
pnpm audit

# Corregir vulnerabilidades automáticamente
pnpm audit --fix

# Commit y deploy
git add pnpm-lock.yaml package.json
git commit -m "chore: update dependencies"
git push origin main
```

## Escalabilidad Futura

Si el tráfico crece y 512MB RAM no es suficiente:

### Upgrade de VPS (1GB+ RAM)
1. Aumentar RAM de VPS a 1GB o 2GB
2. Editar `docker-compose.yml`:
   ```yaml
   db:
     deploy:
       resources:
         limits:
           memory: 512M  # aumentar de 150M
   api:
     deploy:
       resources:
         limits:
           memory: 512M  # aumentar de 128M
   ```

3. Ajustar configuración PostgreSQL:
   ```yaml
   -c max_connections=20        # aumentar de 5
   -c shared_buffers=128MB      # aumentar de 32MB
   -c effective_cache_size=256MB  # aumentar de 64MB
   ```

### Migrar a PostgreSQL Externo
- Usar servicio managed: [Supabase](https://supabase.com/), [Neon](https://neon.tech/), [Railway](https://railway.app/)
- Libera ~150MB RAM en VPS para la API
- Mejor performance y backups automáticos

### Load Balancer + Múltiples Instancias
- Usar Dokploy para escalar horizontalmente (2+ instancias de API)
- PostgreSQL externo (managed service)
- Traefik como load balancer

## Soporte y Recursos

- **Documentación Dokploy**: https://docs.dokploy.com/
- **Fastify Docs**: https://fastify.dev/
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Tuning**: https://pgtune.leopard.in.ua/

## Resumen de Comandos Útiles

```bash
# Ver logs
docker logs -f optic-api

# Ver uso de recursos
docker stats

# Restart servicios
docker-compose restart

# Rebuild e restart
docker-compose up -d --build

# Backup de BD
docker exec optic-db pg_dump -U optic_user optic_db > backup.sql

# Verificar health
curl https://api.dominio.com/health

# Ver contenedores corriendo
docker ps

# Entrar a contenedor (debug)
docker exec -it optic-api sh
docker exec -it optic-db psql -U optic_user optic_db
```

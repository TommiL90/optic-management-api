# 🥽 Optic Management API

API REST para la gestión de ópticas, desarrollada con **Fastify**, **TypeScript**, **Prisma** y **Zod**. Diseñada con arquitectura modular, separación de responsabilidades y patrones de diseño limpio.

## 🚀 Características

- **Framework**: Fastify con TypeScript
- **Base de datos**: Prisma ORM con Turso (producción) / SQLite (desarrollo)
- **Validación**: Zod para schemas y validación de datos
- **Arquitectura**: Modular con separación de responsabilidades (Handler → Service → Repository)
- **Testing**: Vitest con cobertura completa (Unit + E2E)
- **Documentación**: Swagger/OpenAPI automática
- **Logging**: Pino con configuración estructurada
- **Despliegue**: Optimizado para Render con Turso

## 📋 Módulos Disponibles

### 🏥 Health Check
- **GET** `/health` - Estado de la aplicación

### 👥 Usuarios
- **POST** `/users` - Crear usuario
- **GET** `/users` - Listar usuarios (paginado)
- **GET** `/users/:id` - Obtener usuario por ID
- **PUT** `/users/:id` - Actualizar usuario
- **DELETE** `/users/:id` - Eliminar usuario

### 🔍 Lentes
- **POST** `/lenses` - Crear producto de lente
- **GET** `/lenses` - Listar lentes (paginado)
- **GET** `/lenses/:id` - Obtener lente por ID
- **PUT** `/lenses/:id` - Actualizar lente
- **DELETE** `/lenses/:id` - Eliminar lente

### 📊 Rangos de Prescripción
- **POST** `/prescription-ranges` - Crear rango de prescripción
- **GET** `/prescription-ranges` - Listar rangos (paginado)
- **GET** `/prescription-ranges/:id` - Obtener rango por ID
- **PUT** `/prescription-ranges/:id` - Actualizar rango
- **DELETE** `/prescription-ranges/:id` - Eliminar rango

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- **Node.js** >= 22.0.0
- **pnpm** (recomendado) o npm
- **Git**

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd optic-management-api
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables según tu entorno
nano .env
```

**Variables de entorno requeridas:**

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
LOG_PRETTY=false
DATABASE_URL="file:./dev.db"
```

### 3.1. Configurar base de datos con Turso (Opcional para producción)

Para desarrollo local, puedes usar SQLite (por defecto). Para producción en Render, se recomienda usar Turso. Consulta la sección de "Despliegue en Render" para instrucciones completas.

### 4. Configurar base de datos

```bash
# Generar cliente Prisma
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# (Opcional) Poblar base de datos con datos de prueba
pnpm prisma:seed
```

### 5. Ejecutar en desarrollo

```bash
# Modo desarrollo con hot reload
pnpm start:dev

# O modo producción
pnpm build && pnpm start
```

La API estará disponible en:
- **API**: http://localhost:3000
- **Documentación**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🧪 Testing

### Ejecutar todos los tests

```bash
# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e

# Tests con cobertura
pnpm test:coverage

# Tests en modo watch
pnpm test:watch
```

### Estructura de testing

- **Unit Tests**: `src/modules/*/__tests__/*.service.test.ts`
- **E2E Tests**: `src/modules/*/__tests__/*.routes.e2e-test.ts`
- **Repository Tests**: `src/modules/*/__tests__/repositories/`

## 🚀 Despliegue en Render

### 1. Preparación del proyecto

El proyecto está configurado para Render con:
- ✅ Scripts de build optimizados
- ✅ Soporte para Turso (Remote SQLite)
- ✅ Servidor Fastify de larga duración
- ✅ Swagger habilitado en producción

### 2. Configurar base de datos en producción (Turso)

**Turso** es un servicio de base de datos SQLite distribuido, ideal para aplicaciones modernas.

1. **Crear cuenta en Turso**: Ve a [turso.tech](https://turso.tech) y crea una cuenta gratuita

2. **Instalar Turso CLI**:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (PowerShell)
   irm https://get.tur.so/install.ps1 | iex
   ```

3. **Login en Turso**:
   ```bash
   turso auth login
   ```

4. **Crear base de datos**:
   ```bash
   turso db create optic-management-db
   ```

5. **Obtener URL de la base de datos**:
   ```bash
   turso db show optic-management-db --url
   ```
   Output ejemplo: `libsql://optic-management-db-[your-org].turso.io`

6. **Crear token de autenticación**:
   ```bash
   turso db tokens create optic-management-db
   ```
   Output: Un token largo que debes guardar de forma segura

7. **Construir DATABASE_URL completo**:
   ```
   libsql://optic-management-db-[your-org].turso.io?authToken=[your-token]
   ```

### 3. Crear Web Service en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/) y crea una cuenta si no tienes una

2. Click en **"New +"** → **"Web Service"**

3. Conecta tu repositorio de GitHub/GitLab

4. Configura el servicio con los siguientes valores:

   - **Name**: `optic-management-api` (o el nombre que prefieras)
   - **Region**: Selecciona la región más cercana a tus usuarios
   - **Branch**: `main` (o tu rama principal)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     pnpm install && pnpm render-build
     ```
   - **Start Command**:
     ```bash
     pnpm start
     ```
   - **Instance Type**: `Free` (o el plan que necesites)

### 4. Configurar variables de entorno en Render

En la configuración del servicio, agrega las siguientes **Environment Variables**:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Entorno de ejecución |
| `PORT` | (auto) | Render lo asigna automáticamente |
| `HOST` | `0.0.0.0` | Host para escuchar conexiones |
| `LOG_LEVEL` | `info` | Nivel de logging |
| `DATABASE_URL` | `libsql://...?authToken=...` | URL completa de Turso (paso 2.7) |

**Importante**: Asegúrate de que `DATABASE_URL` incluya el `authToken` en la URL.

### 5. Ejecutar migraciones en producción

Antes del primer despliegue o después de cambios en el schema:

**Opción A: Usando Turso CLI (Recomendado)**

```bash
# Conectar a tu base de datos de Turso
turso db shell optic-management-db

# Dentro del shell, puedes verificar las tablas
.tables

# Salir
.quit
```

Para aplicar migraciones, configura temporalmente tu `.env` local:

```bash
# En .env
DATABASE_URL="libsql://optic-management-db-[your-org].turso.io?authToken=[your-token]"

# Ejecutar migraciones
pnpm prisma:migrate:deploy

# (Opcional) Poblar con datos iniciales
pnpm prisma:seed
```

**Opción B: Desde Render Shell (después del deploy)**

1. Ve a tu servicio en Render
2. Click en **"Shell"** en el menú lateral
3. Ejecutar:
   ```bash
   cd /opt/render/project/src
   pnpm prisma:migrate:deploy
   ```

### 6. Desplegar

Render detectará automáticamente los cambios en tu repositorio y desplegará:

1. **Push a tu repositorio**:
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **Render iniciará el build automáticamente**:
   - Instalará dependencias
   - Generará el cliente Prisma
   - Compilará TypeScript
   - Iniciará el servidor

3. **Monitorear el despliegue**:
   - Ve a la pestaña "Logs" en el dashboard de Render
   - Verifica que no haya errores durante el build

### 7. Verificar despliegue

Una vez desplegado, tu API estará disponible en:
- **API**: `https://optic-management-api.onrender.com` (o tu URL personalizada)
- **Documentación**: `https://optic-management-api.onrender.com/docs`
- **Health Check**: `https://optic-management-api.onrender.com/health`

**Prueba el health check**:
```bash
curl https://optic-management-api.onrender.com/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T..."
}
```

### 8. Notas importantes sobre Render

- **Cold Starts**: El plan gratuito de Render pone el servicio en suspensión después de 15 minutos de inactividad. La primera petición después puede tardar 30-60 segundos.
- **Logs**: Accede a logs en tiempo real desde el dashboard de Render.
- **SSL**: Render proporciona certificados SSL gratuitos automáticamente.
- **Custom Domain**: Puedes agregar un dominio personalizado en la configuración del servicio.
- **Escalado**: Puedes escalar verticalmente (más CPU/RAM) o horizontalmente (más instancias) desde el dashboard.

## 📚 Documentación de la API

La documentación interactiva está disponible en `/docs` cuando la aplicación está ejecutándose.

### Ejemplos de uso

**Crear un usuario:**
```bash
curl -X POST https://tu-api.onrender.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

**Obtener usuarios:**
```bash
curl https://tu-api.onrender.com/users?page=1&pageSize=10
```

**Crear un producto de lente:**
```bash
curl -X POST https://tu-api.onrender.com/lenses \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LENS-001",
    "name": "Lente Monofocal Orgánico",
    "material": "organico",
    "tipo": "monofocal",
    "frameType": "cerrado",
    "basePrice": 50000,
    "finalPrice": 75000,
    "deliveryDays": 7,
    "prescriptionRangeId": "range-id"
  }'
```

## 🏗️ Arquitectura

### Separación de Responsabilidades

```
Handler (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database (Prisma + PostgreSQL/SQLite)
```

### Patrones Implementados

- **Dependency Injection**: Factories para crear servicios
- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio centralizada
- **Schema Validation**: Zod para validación y tipos
- **Error Handling**: Manejo centralizado de errores
- **Logging**: Logging estructurado con contexto

### Estructura de Módulos

```
src/modules/{module}/
├── __tests__/           # Tests del módulo
├── factories/           # Factory functions
├── repositories/         # Interfaces y implementaciones
├── schemas/             # Zod schemas
├── {module}.handlers.ts # HTTP handlers
├── {module}.plugin.ts  # Fastify plugin
├── {module}.routes.ts  # Route definitions
└── {module}.service.ts # Business logic
```

## 🌐 Configuración con Turso

### Ventajas de Turso

- **Edge Computing**: Base de datos distribuida globalmente
- **SQLite Compatible**: Misma sintaxis que SQLite local
- **Serverless**: Optimizado para funciones serverless
- **Gratuito**: Plan gratuito generoso
- **Rápido**: Latencia ultra-baja

### Comandos útiles de Turso

```bash
# Ver todas las bases de datos
turso db list

# Ver información de una base de datos
turso db show optic-management

# Crear una réplica local
turso db shell optic-management

# Ver logs de la base de datos
turso db logs optic-management

# Eliminar base de datos
turso db destroy optic-management
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev          # Servidor con hot reload
pnpm start              # Servidor de producción

# Build
pnpm build              # Build para producción
pnpm render-build       # Build completo para Render (prisma + build)

# Testing
pnpm test               # Tests unitarios
pnpm test:e2e          # Tests E2E
pnpm test:coverage     # Tests con cobertura
pnpm test:watch        # Tests en modo watch

# Database
pnpm prisma:migrate     # Migraciones de desarrollo
pnpm prisma:migrate:deploy # Migraciones de producción
pnpm prisma:generate   # Generar cliente Prisma
pnpm prisma:studio     # Abrir Prisma Studio
pnpm prisma:seed       # Poblar base de datos

# Code Quality
pnpm lint              # Linter
pnpm lint:fix          # Linter con auto-fix
pnpm format            # Formatear código
```

## 🐛 Troubleshooting

### Problemas comunes

**Error de conexión a base de datos:**
```bash
# Verificar que DATABASE_URL esté configurada
echo $DATABASE_URL

# Regenerar cliente Prisma
pnpm prisma:generate

# Verificar conexión con Turso
turso db shell optic-management-db
```

**Error en Render deployment:**
```bash
# Verificar variables de entorno en Render dashboard
# Ir a: Service → Environment → Environment Variables

# Revisar logs en tiempo real
# Ir a: Service → Logs

# Reiniciar el servicio manualmente
# Ir a: Service → Manual Deploy → Deploy latest commit
```

**Tests fallando:**
```bash
# Limpiar cache de tests
pnpm test --reporter=verbose

# Ejecutar tests específicos
pnpm test src/modules/users/__tests__/users.service.test.ts
```

**Build falla en Render:**
```bash
# Verificar que el comando de build sea correcto:
# Build Command: pnpm install && pnpm render-build

# Verificar que pnpm esté instalado correctamente
# Agregar variable de entorno en Render:
# ENABLE_PNPM=true
```

## 📄 Licencia

ISC

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre la API, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ usando Fastify, TypeScript y Prisma**

# 🥽 Optic Management API

API REST para la gestión de ópticas, desarrollada con **Fastify**, **TypeScript**, **Prisma** y **Zod**. Diseñada con arquitectura modular, separación de responsabilidades y patrones de diseño limpio.

## 🚀 Características

- **Framework**: Fastify con TypeScript
- **Base de datos**: Prisma ORM con PostgreSQL (producción) / SQLite (desarrollo)
- **Validación**: Zod para schemas y validación de datos
- **Arquitectura**: Modular con separación de responsabilidades (Handler → Service → Repository)
- **Testing**: Vitest con cobertura completa (Unit + E2E)
- **Documentación**: Swagger/OpenAPI automática
- **Logging**: Pino con configuración estructurada
- **Despliegue**: Optimizado para Render con PostgreSQL

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
DATABASE_URL="file:./dev.db" # Desarrollo (SQLite por defecto)
# Para PostgreSQL (producción o desarrollo):
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
```

### 3.1. Configurar base de datos con PostgreSQL (Recomendado para producción)

Para desarrollo local, puedes usar SQLite (por defecto). Para producción en Render u otra plataforma, se recomienda usar PostgreSQL. Consulta la sección de "Despliegue en Render" para instrucciones completas y la variable `DATABASE_URL` con formato PostgreSQL.

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
- ✅ Soporte para PostgreSQL gestionado
- ✅ Servidor Fastify de larga duración
- ✅ Swagger habilitado en producción

### 2. Configurar base de datos en producción (PostgreSQL)

Usa un servicio gestionado de PostgreSQL (por ejemplo, el add-on de PostgreSQL en Render) o cualquier proveedor (Neon, Supabase, RDS, etc.).

1. **Crear base de datos PostgreSQL**: En Render, crea un recurso de tipo "PostgreSQL" o provisiona en tu proveedor preferido.

2. **Obtener `DATABASE_URL`**: Copia la cadena de conexión en formato:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
   ```

3. **Ajustar Prisma para PostgreSQL**: En `prisma/schema.prisma`, cambia el `provider` del `datasource` a `postgresql` para producción (mantén SQLite para desarrollo si lo prefieres):
   - `provider = "postgresql"`

4. **Configurar migraciones**: Usa los comandos de Prisma indicados más abajo para aplicar migraciones.

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
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public` | URL de conexión de PostgreSQL |

**Importante**: Asegúrate de que `DATABASE_URL` tenga credenciales válidas y apunte al esquema correcto (por defecto `public`).

### 5. Ejecutar migraciones en producción

Antes del primer despliegue o después de cambios en el schema:

**Aplicar migraciones**

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

## 🌐 Configuración con PostgreSQL

### Notas y buenas prácticas

- Usa roles de solo lectura/escritura según necesidad.
- Habilita conexiones TLS si tu proveedor lo soporta.
- Configura `connection_limit` en Render para evitar agotamiento de conexiones; considera un pooler (p. ej., PgBouncer) si tu tráfico es alto.
- Ajusta `prisma` para producción: usa `prisma:migrate:deploy` en lugar de `prisma migrate dev`.

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

# Verificar acceso a PostgreSQL (ejemplo con psql)
# psql "postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
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

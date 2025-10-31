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
- **Despliegue**: Optimizado para Vercel (serverless)

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

### 3.1. Configurar base de datos con Turso (Recomendado)

Para usar Turso como base de datos en producción:

```bash
# Ejecutar script de configuración automática
pnpm setup:turso
```

Este script:
- Instala Turso CLI si no está disponible
- Te guía para hacer login en Turso
- Crea la base de datos
- Configura las variables de entorno
- Ejecuta las migraciones
- Genera el cliente Prisma

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

## 🚀 Despliegue en Vercel

### 1. Preparación del proyecto

El proyecto ya está configurado para Vercel con:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `api/index.ts` - Handler serverless
- ✅ Scripts de build optimizados
- ✅ Soporte para PostgreSQL

### 2. Configurar base de datos en producción

**Opción A: Turso (Recomendado)**

1. **Crear cuenta en Turso**: Ve a [turso.tech](https://turso.tech) y crea una cuenta
2. **Instalar Turso CLI**: 
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. **Login en Turso**:
   ```bash
   turso auth login
   ```
4. **Crear base de datos**:
   ```bash
   turso db create optic-management
   ```
5. **Obtener URL y token**:
   ```bash
   turso db show optic-management --url
   turso auth token
   ```

**Opción B: Base de datos externa**

Usa cualquier proveedor de SQLite compatible (Turso, PlanetScale, etc.)

### 3. Configurar variables de entorno en Vercel

En el dashboard de Vercel:

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega las siguientes variables:

```env
NODE_ENV=production
DATABASE_URL=libsql://optic-management-[your-db-name].turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
LOG_LEVEL=info
```

### 4. Desplegar

**Opción A: Desde GitHub (Recomendado)**

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente la configuración
3. El despliegue se ejecutará automáticamente

**Opción B: Desde CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel --prod
```

### 5. Ejecutar migraciones en producción

Las migraciones se ejecutan automáticamente durante el despliegue gracias al script `postinstall.js`. Si necesitas ejecutarlas manualmente:

```bash
# Conectar a la base de datos de producción
vercel env pull .env.production

# Ejecutar migraciones
pnpm prisma:migrate:deploy

# (Opcional) Poblar con datos iniciales
pnpm prisma:seed
```

### 6. Verificar despliegue

Una vez desplegado, tu API estará disponible en:
- **API**: `https://tu-proyecto.vercel.app`
- **Documentación**: `https://tu-proyecto.vercel.app/docs`
- **Health Check**: `https://tu-proyecto.vercel.app/health`

## 📚 Documentación de la API

La documentación interactiva está disponible en `/docs` cuando la aplicación está ejecutándose.

### Ejemplos de uso

**Crear un usuario:**
```bash
curl -X POST https://tu-api.vercel.app/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

**Obtener usuarios:**
```bash
curl https://tu-api.vercel.app/users?page=1&pageSize=10
```

**Crear un producto de lente:**
```bash
curl -X POST https://tu-api.vercel.app/lenses \
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
pnpm build              # Build para desarrollo
pnpm build:vercel       # Build optimizado para Vercel
pnpm vercel-build       # Build completo para Vercel

# Base de datos
pnpm setup:turso        # Configurar Turso automáticamente

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
```

**Error en Vercel deployment:**
```bash
# Verificar que las variables de entorno estén configuradas
vercel env ls

# Revisar logs de build
vercel logs
```

**Tests fallando:**
```bash
# Limpiar cache de tests
pnpm test --reporter=verbose

# Ejecutar tests específicos
pnpm test src/modules/users/__tests__/users.service.test.ts
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

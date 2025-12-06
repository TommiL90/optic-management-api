# ============================================
# Stage 1: Builder (Dependencias + Build)
# ============================================
FROM node:24-alpine AS builder

# Metadata
LABEL maintainer="optic-management-api"
LABEL description="Builder stage for optic-management-api"

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /app

# Copiar archivos de dependencias primero (layer caching)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Instalar TODAS las dependencias (necesarias para build + Prisma generate)
# --frozen-lockfile: Asegura reproducibilidad
# --prefer-offline: Usa caché local si existe
RUN pnpm install --frozen-lockfile --prefer-offline

# Copiar código fuente
COPY src ./src
COPY tsconfig.json tsup.config.ts ./

# Generar Prisma Client (se guarda en node_modules/.prisma/client)
RUN pnpm prisma:generate

# Ejecutar build de producción (tsup compila src/server.ts → build/server.cjs)
RUN pnpm build

# ============================================
# Stage 2: Production Runtime (Minimal)
# ============================================
FROM node:24-alpine AS production

# Metadata
LABEL maintainer="optic-management-api"
LABEL description="Production runtime for optic-management-api"

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Instalar SOLO dependencias de producción
# --prod: Solo production dependencies
# --frozen-lockfile: Reproducibilidad
RUN pnpm install --prod --frozen-lockfile --prefer-offline

# Copiar build compilado desde builder
COPY --from=builder /app/build ./build

# Copiar Prisma Client generado desde builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar script de entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Cambiar ownership a usuario no-root
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto interno (Traefik maneja routing externo)
EXPOSE 3000

# Health check ligero (reduce overhead)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "build/server.cjs"]

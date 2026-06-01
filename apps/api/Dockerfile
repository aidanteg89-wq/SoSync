# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo manifests so npm install can resolve the workspace graph.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all deps (dev + prod) for the build step.
RUN npm ci

# Copy source and build.
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build -w apps/api

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled output + everything Prisma / Express need at runtime.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3000

# Apply migrations on boot, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

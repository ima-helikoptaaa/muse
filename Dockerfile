FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy workspace package.json files
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Copy prisma and generate
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && npx prisma generate

# Copy source and build shared first, then backend
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

COPY apps/backend ./apps/backend
RUN npm run build --workspace=apps/backend

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

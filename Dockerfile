# © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
# Delivery Clarity — Production Dockerfile
# Multi-stage build: build stage + minimal production image

# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the production runtime bundle.
COPY --from=builder /app/public         ./public
COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/package.json   ./package.json
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/scripts        ./scripts

# Create the data directory with correct ownership
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

# PORT is a starting preference, not a hard lock — start-server.js falls
# back to the next free port if it's already taken inside the container.
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run DB migrations then start the app (auto-picks a free port)
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true && node scripts/start-server.js start"]

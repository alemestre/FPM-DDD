# ---- Build Stage ----
ARG NODE_VERSION
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Copy lockfile and manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# The Prisma client is gitignored and imported by the app, so generate it before building.
RUN cd apps/shop-api && npx prisma generate --config prisma7.config.ts

# Build the app and prune the lockfile. The prune target depends on build, so this
# produces main.js plus a pruned package.json + package-lock.json + workspace_modules
# in the output directory.
RUN npx nx run shop-api:prune --configuration=production

# Install production-only packages against the pruned lockfile
WORKDIR /app/dist/apps/shop-api
RUN npm ci --omit=dev --ignore-scripts

# ---- Runtime Stage ----
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built output + production node_modules
COPY --from=builder /app/dist/apps/shop-api ./

EXPOSE 3000

CMD ["node", "main.js"]

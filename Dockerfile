FROM node:24-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# ---- dependencies -----------------------------------------------------------
# --ignore-scripts skips the husky `prepare` script, there are no git hooks to install in here.
FROM base AS deps
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS prod-deps
# optional deps are the swc compiler and sharp, only needed when building
RUN pnpm install --frozen-lockfile --ignore-scripts --prod --no-optional

# ---- build ------------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runtime ----------------------------------------------------------------
# No 'output: standalone' here, the custom server in server/ (socket.io) needs the full prod node_modules.
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/next.config.js ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/server/index.js"]

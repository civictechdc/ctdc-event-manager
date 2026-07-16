FROM node:24.18.0-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN npm install -g bun && \
    bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN bun run build
RUN bun install --frozen-lockfile --production

FROM node:24.18.0-alpine

WORKDIR /app

RUN addgroup -g 1001 -S eventuser && \
    adduser -S eventuser -u 1001

COPY --from=builder --chown=eventuser:eventuser /app/dist ./dist
COPY --from=builder --chown=eventuser:eventuser /app/node_modules ./node_modules
COPY --from=builder --chown=eventuser:eventuser /app/package.json ./

USER eventuser

ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]

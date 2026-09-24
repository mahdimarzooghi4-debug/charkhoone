FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs22-debian13:nonroot@sha256:5e9868cc8ef163e86378ff90de23ca031f5bb8b2023d4f3288a5e740698919d4 AS runtime
ARG VCS_REF=unknown
LABEL org.opencontainers.image.source="https://github.com/mahdimarzooghi4-debug/charkhoone" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.title="Charkhoone Web"

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=build --chown=65532:65532 /app/public ./public

EXPOSE 3000
CMD ["server.js"]

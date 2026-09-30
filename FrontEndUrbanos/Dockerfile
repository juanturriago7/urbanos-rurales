# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=""
ARG VITE_APP_NAME="Portal Inmobiliario"
# Provisional: aun no hay dominio de produccion confirmado. El default NO
# puede quedar vacio: vite.config.ts solo aplica su propio fallback cuando la
# variable es nullish, y un ARG vacio ya cuenta como definida.
ARG VITE_SITE_URL="https://urbanosrurales.com"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN pnpm build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

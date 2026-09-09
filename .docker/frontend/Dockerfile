# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged
ARG NGINX_VERSION=1.29

FROM node:${NODE_VERSION}-alpine AS development
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM development AS build
ARG VITE_API_URL=/api
ARG VITE_SITE_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SITE_URL=${VITE_SITE_URL}
RUN npm run build

FROM ${NGINX_IMAGE}:${NGINX_VERSION}-alpine AS production
USER root
RUN apk upgrade --no-cache
USER 101
ENV TRAEFIK_TRUSTED_IP=127.0.0.1
ENV NGINX_ENVSUBST_FILTER=^TRAEFIK_TRUSTED_IP$
COPY .docker/frontend/nginx.conf /etc/nginx/templates/default.conf.template
COPY .docker/frontend/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

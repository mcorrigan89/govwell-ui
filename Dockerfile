# The preview (sample app at ?example=app) and the registry JSON, served by
# nginx. Built and deployed by Dokploy from main to https://govwell-ui.sourgrapes.dev.
#   docker build --build-arg REGISTRY_URL=https://<domain> -t govwell-ui .
FROM node:24-alpine AS build
RUN npm install -g pnpm@11.9.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# where /r/<name>.json is served; items reference each other by this URL
ARG REGISTRY_URL=https://govwell-ui.sourgrapes.dev
ENV REGISTRY_URL=$REGISTRY_URL
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

FROM node:18-alpine AS build
WORKDIR /app/admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
COPY pong/ ../pong/

RUN npm run build

FROM node:18-alpine
WORKDIR /app/admin

COPY --from=build /app/admin/package*.json ./
RUN npm ci --only=production

COPY --from=build /app/admin/dist ./dist

EXPOSE 443

CMD [ "npx", "serve", "-s", "dist", "-l", "443", "--ssl-cert", "/app/admin/certs/cert.pem", "--ssl-key",  "/app/admin/certs/key.pem" ]

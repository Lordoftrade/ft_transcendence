FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=build /app/package*.json ./

RUN npm ci --only=production

COPY --from=build /app/dist ./dist

EXPOSE 443

CMD [ "npx", "serve", "-s", "dist", "-l", "443", "--ssl-cert", "/app/certs/cert.pem", "--ssl-key",  "/app/certs/key.pem" ]
FROM node:23-alpine

WORKDIR /app

#возможно потребуется создать юзера с UID совпадающим с UID школьного компа, можно передать через .env
COPY package*.json ./

RUN npm ci

RUN npm install --save-dev @types/node

COPY . .


RUN npx prisma generate

RUN npm run build

RUN npm prune --production

EXPOSE 3000

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD [ "./entrypoint.sh" ]
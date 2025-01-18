FROM node:18-alpine as builder

WORKDIR /build

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build


#Stage-2

FROM node:18-alpine as runner

WORKDIR /app

COPY --from=builder build/package*.json .
COPY --from=builder build/next.config.mjs .
COPY --from=builder build/node_modules node_modules/
COPY --from=builder build/.next ./.next

EXPOSE 3000

CMD ["npm", "run", "start"]

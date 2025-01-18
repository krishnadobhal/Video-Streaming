FROM node:18-alpine 

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY controller controller
COPY index.js index.js
COPY kafka kafka
COPY routes routes
COPY ca.pem ca.pem
COPY db db
COPY prisma prisma

RUN npm install
RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]



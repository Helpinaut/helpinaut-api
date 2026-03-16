# Build
FROM node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL

COPY . .

RUN npx prisma generate

RUN npm run build

# Production
FROM node:20-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /usr/src/app/dist ./dist

COPY prisma ./prisma

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

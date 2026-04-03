FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@8.15.1

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@8.15.1

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 1234 1235

CMD ["node", "dist/server.js"]

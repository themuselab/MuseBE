# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tini

# build stage의 node_modules 통째 사용 — prisma CLI/dotenv/prisma.config 의존 다 포함
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma.config.ts ./
COPY prisma ./prisma
# swagger.ts loads yaml via __dirname = dist/docs at runtime
COPY src/docs/*.yaml ./dist/docs/

RUN mkdir -p /app/uploads

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]

# Backend MedApp · build desde la RAÍZ del monorepo:
#   docker build -f backend/Dockerfile -t medapp-api .
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --filter backend --frozen-lockfile
COPY backend backend
RUN pnpm --filter backend build \
 && pnpm --filter backend deploy --prod /out \
 && cp -r backend/dist /out/dist

FROM node:20-alpine
ENV NODE_ENV=production PORT=3000 TZ=America/Argentina/Mendoza
WORKDIR /app
COPY --from=build /out ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/index.js"]

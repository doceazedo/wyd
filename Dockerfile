FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM deps AS build
COPY . .
RUN pnpm build

FROM node:24-alpine AS runtime
RUN apk add --no-cache ca-certificates libstdc++
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV IMPER_CACHE_DIR=/app/.cache/impers
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./
RUN mkdir -p /app/.data /app/.cache/impers && chown -R node:node /app/.data /app/.cache
USER node
EXPOSE 3000
CMD ["node", "build"]

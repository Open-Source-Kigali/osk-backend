FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Prisma runs postinstall during install, so copy its TypeScript config first.
COPY tsconfig.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store \
    --allow-build=@prisma/engines --allow-build=prisma \
    --allow-build='!@scarf/scarf'

COPY src ./src
COPY docs ./docs

RUN pnpm run build
RUN pnpm prune --prod --ignore-scripts --store-dir=/pnpm/store

FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docs ./docs

USER node

EXPOSE 3000

CMD ["npm", "start"]

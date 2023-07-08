# BASE
FROM node:18-alpine AS base
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /my-space
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./


# BUILD
FROM base AS builder
WORKDIR /my-space
# COPY --from=deps /my-space/node_modules ./node_modules
COPY . .
RUN npm i -g next
RUN npm install
RUN npm run build


# RUN
FROM base AS runner
WORKDIR /my-space

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /my-space/package.json .
COPY --from=builder /my-space/package-lock.json .
COPY --from=builder /my-space/DockerStartup.sh .

COPY --from=builder /my-space/src/integrations/prisma ./src/integrations/prisma

COPY --from=builder /my-space/next.config.js ./
COPY --from=builder /my-space/public ./public
COPY --from=builder /my-space/.next/standalone ./
COPY --from=builder /my-space/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
# CMD ["node", "DockerStartup.js"]

CMD ["./DockerStartup.sh"]

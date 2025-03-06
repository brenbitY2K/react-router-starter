FROM node:20-bookworm-slim as base
RUN npm install -g pnpm@8.6.12

FROM base AS builder
WORKDIR /app
RUN npm install -g turbo@1.13.3
COPY . .
RUN turbo prune business-dashboard --docker

FROM base AS installer
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install
COPY --from=builder /app/out/full/ .
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

# Build stage
FROM installer AS build
RUN npx turbo build --filter=business-dashboard...

# Lint stage
FROM build AS lint
RUN npx turbo lint --filter=business-dashboard...

# Test stage
FROM build AS test
RUN npx turbo test --filter=business-dashboard... -- --run

# Development stage
FROM installer as development
WORKDIR /app
CMD npx turbo run dev --filter=business-dashboard...

# Production stage
FROM base AS runner
WORKDIR /app
COPY --from=build /app .
CMD cd packages/www/apps/business-dashboard && pnpm start

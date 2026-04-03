# Base image with pnpm
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy everything for monorepo context
COPY . /app
WORKDIR /app

# Build phase
FROM base AS build
RUN pnpm install
RUN pnpm run build --filter=@syncdoc/web

# Production image
FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "pnpm", "start", "--filter", "@syncdoc/web" ]

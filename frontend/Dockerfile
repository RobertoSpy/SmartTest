# frontend/Dockerfile
FROM node:20-bullseye-slim

WORKDIR /app

# copy package files first to take advantage of Docker layer cache
COPY package.json package-lock.json* ./

# Use npm ci if lockfile exists, else npm install
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# copy rest of frontend sources
COPY . /app

EXPOSE 5173

# dev command: use npx to ensure we find the local binary
CMD ["npx", "vite", "--host"]
# frontend/Dockerfile
FROM node:18-bullseye-slim

WORKDIR /app

# copy package files first to take advantage of Docker layer cache
COPY package.json package-lock.json* ./

# Use npm ci if lockfile exists, else npm install
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# copy rest of frontend sources
COPY . /app

EXPOSE 5173

# dev command: allow binding to 0.0.0.0 via --host
CMD ["npm", "run", "dev", "--", "--host"]
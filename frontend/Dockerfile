FROM node:18-bullseye-slim

WORKDIR /app

# copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# copy rest of frontend sources
COPY . /app

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# recipes/ is mounted at runtime — the site is built on container startup
EXPOSE 4321

CMD ["sh", "-c", "npm run build && node_modules/.bin/astro preview --host 0.0.0.0 --port 4321"]

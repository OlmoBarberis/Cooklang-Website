FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# recipes/ is mounted at runtime — sync images and start on container startup
EXPOSE 4321

CMD ["sh", "-c", "HOST=0.0.0.0 PORT=4321 npm run start"]

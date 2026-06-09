# Build stage to copy source files and install dependencies
FROM node:18-alpine AS builder  

WORKDIR /app 

COPY package*.json ./
COPY server.js ./
COPY public ./public
RUN npm ci --only=production && \
    mkdir -p logs public/

EXPOSE 3000

CMD ["node", "server.js"]
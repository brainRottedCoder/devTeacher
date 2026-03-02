FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for building typescript
COPY package.json package-lock.json* ./
RUN npm ci

# Copy server code
COPY server/ ./server/
COPY tsconfig.json ./

# Compile websocket.ts to Javascript
RUN npx tsc server/websocket.ts --module CommonJS --target ES2022 --outDir dist/server

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV production

# Only install production deps (websocket module `ws`)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/server ./server

# Run the compiled JS directly
CMD ["node", "server/websocket.js"]

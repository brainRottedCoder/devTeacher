FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/simulation/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY services/simulation/index.ts ./

# Build TypeScript
RUN npm install -g tsx && \
    tsc index.ts --outDir dist --esModuleInterop --module CommonJS --moduleResolution node --target ES2020 || true

# Expose ports
EXPOSE 3003 3005

# Start the service
CMD ["tsx", "index.ts"]

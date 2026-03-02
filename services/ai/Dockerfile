FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/ai/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY services/ai/index.ts ./

# Expose port
EXPOSE 3004

# Start the service
CMD ["tsx", "index.ts"]

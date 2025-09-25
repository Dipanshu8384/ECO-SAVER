# Dockerfile for EcoSaver - Production Ready
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code (including your beautiful frontend)
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ecosaver -u 1001

# Change ownership
RUN chown -R ecosaver:nodejs /app
USER ecosaver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
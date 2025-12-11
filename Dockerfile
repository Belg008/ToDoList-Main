# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production=false

# Copy application files
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Create data directory for persistent storage
RUN mkdir -p /app/uploads

# Expose port 3000
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]

# Multi-stage build for CareerPilot

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Backend
FROM node:18-alpine
WORKDIR /app

# Copy backend files
COPY server/ ./server/
COPY package*.json ./
RUN npm install --production

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./public

# Expose port
EXPOSE 8000

# Start server
CMD ["node", "server/index.js"]


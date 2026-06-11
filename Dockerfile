# Multi-stage build for Expo web app
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and scripts (needed for postinstall)
COPY package*.json yarn.lock* pnpm-lock.yaml* ./
COPY scripts ./scripts

# Install dependencies with proper caching
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm install --frozen-lockfile --legacy-peer-deps; \
    fi

# Copy remaining source code
COPY . .

# Build for web - Expo export
RUN npm run web:build

# Verify build output exists
RUN if [ ! -d "dist" ] && [ ! -d ".expo/web" ]; then \
      echo "Build output not found in expected locations" && exit 1; \
    fi && \
    ls -la

# Stage 2: Runtime stage - lightweight Nginx only
FROM nginx:alpine

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/.expo/web /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Create required nginx directories with proper permissions
RUN mkdir -p /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid /var/log/nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

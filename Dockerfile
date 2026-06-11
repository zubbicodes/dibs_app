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

# Find and verify build output - consolidate to /app/web-dist
RUN mkdir -p /app/web-dist && \
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then \
      echo "Copying from dist/"; \
      cp -r dist/* /app/web-dist/; \
    elif [ -d ".expo/web" ] && [ -f ".expo/web/index.html" ]; then \
      echo "Copying from .expo/web/"; \
      cp -r .expo/web/* /app/web-dist/; \
    elif [ -d "static" ] && [ -f "static/index.html" ]; then \
      echo "Copying from static/"; \
      cp -r static/* /app/web-dist/; \
    else \
      echo "ERROR: No build output found"; \
      echo "Checking for index.html:"; \
      find . -maxdepth 3 -name "index.html" 2>/dev/null || echo "No index.html found"; \
      ls -la . | head -30; \
      exit 1; \
    fi && \
    echo "Build output consolidated to web-dist:" && \
    ls -la /app/web-dist/ | head -20

# Stage 2: Runtime stage - lightweight Nginx only
FROM nginx:alpine

WORKDIR /app

# Copy nginx configuration FIRST
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy consolidated web build from builder stage
COPY --from=builder /app/web-dist /usr/share/nginx/html/

# Verify files were copied
RUN echo "Nginx HTML directory contents:" && \
    ls -la /usr/share/nginx/html/ && \
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then \
      echo "ERROR: index.html not found in /usr/share/nginx/html"; \
      exit 1; \
    fi

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

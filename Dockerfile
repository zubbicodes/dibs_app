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

# Show available npm scripts
RUN echo "=== Available npm scripts ===" && npm run 2>&1 | grep -E "^\s+(web|build)" || echo "No web build scripts found"

# Try to build for web - use explicit Expo command with verbose output
RUN echo "=== Starting Expo web export ===" && \
    npm run web:build || npx expo export -p web --verbose

# List root directory contents
RUN echo "=== Root directory after build ===" && \
    ls -la / | head -30

# Find all directories and index.html files
RUN echo "=== Searching for index.html ===" && \
    find . -maxdepth 4 -name "index.html" -type f 2>/dev/null | head -20 || echo "No index.html found"

# Find and verify build output - consolidate to /app/web-dist
RUN mkdir -p /app/web-dist && \
    found=0 && \
    for dir in dist .expo/web web-build build static out; do \
      if [ -d "$dir" ] && [ -f "$dir/index.html" ]; then \
        echo "✓ Found build output in: $dir"; \
        cp -r "$dir"/* /app/web-dist/ 2>/dev/null || true; \
        found=1; \
        break; \
      fi; \
    done && \
    if [ $found -eq 0 ]; then \
      echo "ERROR: No build output found in any expected directory"; \
      echo "=== Current directory contents ===" && \
      ls -la . | head -40 && \
      echo "=== Searching all directories ===" && \
      find . -type d -maxdepth 3 2>/dev/null | head -20 && \
      exit 1; \
    fi && \
    echo "=== web-dist contents ===" && \
    ls -la /app/web-dist/ | head -30

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

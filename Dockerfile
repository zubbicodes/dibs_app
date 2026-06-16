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

# Copy dist directory (Expo web output)
RUN if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then \
      echo "ERROR: dist directory or index.html not found!"; \
      echo "=== Current directory contents ===" && ls -la; \
      exit 1; \
    fi && \
    mkdir -p /app/web-dist && \
    cp -r dist/* /app/web-dist/ && \
    echo "=== web-dist contents ===" && ls -la /app/web-dist/

# Stage 2: Runtime stage - lightweight Nginx only
FROM nginx:alpine

WORKDIR /app

# Copy nginx configuration FIRST
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy consolidated web build from builder stage
COPY --from=builder /app/web-dist /usr/share/nginx/html/ 2>/dev/null || true

# Create diagnostic page and verify setup
RUN mkdir -p /usr/share/nginx/html && \
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then \
      cat > /usr/share/nginx/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
  <title>DIBS - Build Diagnostic</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .info { color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>🐳 DIBS Application - Docker Build</h1>
  
  <div class="error">
    <strong>⚠️ Build Issue Detected</strong>
    <p>No application files were found in the build output.</p>
    <p>The Expo web build may have failed or produced no output.</p>
  </div>

  <div class="info">
    <strong>✓ Good News:</strong>
    <ul>
      <li>Nginx is running correctly</li>
      <li>Container is operational</li>
      <li>Issue is with the build process, not deployment</li>
    </ul>
  </div>

  <h2>Next Steps:</h2>
  <ol>
    <li>Check the Docker build logs in Coolify for errors</li>
    <li>Look for diagnostic output showing build directories</li>
    <li>Verify npm run web:build creates output locally</li>
  </ol>

  <p><small>If you see this page, the build output is missing.</small></p>
</body>
</html>
HTMLEOF
    fi && \
    echo "=== Nginx HTML directory contents ===" && \
    ls -la /usr/share/nginx/html/ | head -20

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

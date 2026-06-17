const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createRequestHandler } = require('expo-server/adapter/http');

const port = Number(process.env.PORT || 80);
const rootDir = __dirname;
const clientDir = path.join(rootDir, 'dist', 'client');
const serverDir = path.join(rootDir, 'dist', 'server');

const expoHandler = createRequestHandler({
  build: serverDir,
  environment: process.env.NODE_ENV || 'production',
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function resolveStaticPath(urlPath) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const staticPath = path.normalize(path.join(clientDir, decodedPath));
  if (!staticPath.startsWith(clientDir)) {
    return null;
  }

  return staticPath;
}

function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const staticPath = resolveStaticPath(url.pathname);
  if (!staticPath || !fs.existsSync(staticPath) || !fs.statSync(staticPath).isFile()) {
    return false;
  }

  const ext = path.extname(staticPath).toLowerCase();
  const isImmutableAsset = url.pathname.startsWith('/_expo/');

  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': isImmutableAsset
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600, must-revalidate',
  });

  if (req.method === 'HEAD') {
    res.end();
    return true;
  }

  fs.createReadStream(staticPath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    sendText(res, 200, 'healthy\n');
    return;
  }

  if (serveStatic(req, res)) return;

  await expoHandler(req, res, (error) => {
    if (error) {
      console.error(error);
      sendText(res, 500, 'Internal server error\n');
      return;
    }

    sendText(res, 404, 'Not found\n');
  });
});

server.listen(port, () => {
  console.log(`DIBS web server listening on port ${port}`);
});

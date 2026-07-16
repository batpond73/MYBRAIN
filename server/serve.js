/**
 * Minimal static server for the Expo web SPA build.
 *
 * `expo export --platform web` (with app.json's web.output = "single")
 * writes an SPA into ./dist. This serves it on $PORT with:
 *  - long-cache for hashed assets under /_expo/static/
 *  - short-cache for everything else
 *  - SPA fallback: unknown paths return dist/index.html
 *
 * Zero external dependencies — uses only Node built-ins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "..", "dist");
const INDEX = path.join(DIST, "index.html");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function cacheControl(urlPath) {
  return urlPath.startsWith("/_expo/static/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";
}

function serveFile(filePath, urlPath, res) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "content-type": MIME[ext] || "application/octet-stream",
    "cache-control": cacheControl(urlPath),
  });
  fs.createReadStream(filePath).pipe(res);
}

if (!fs.existsSync(INDEX)) {
  console.error(`[mybrain-v2] dist/index.html not found at ${INDEX}`);
  console.error("[mybrain-v2] run \"npm run build\" before starting the server");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);
    const rel = path.posix.normalize(pathname).replace(/^\/+/, "");
    const resolved = path.join(DIST, rel);

    if (!resolved.startsWith(DIST)) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("Forbidden");
    }

    if (rel && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return serveFile(resolved, pathname, res);
    }

    return serveFile(INDEX, "/", res);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`Server error: ${err.message}`);
  }
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`[mybrain-v2] serving ${DIST} on http://0.0.0.0:${port}`);
});

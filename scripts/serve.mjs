import { createServer } from "node:http";
import { readFileSync, statSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};
const port = Number(process.env.PORT || 3000);
createServer((req, res) => {
  try {
    const path = decodeURIComponent(
      new URL(req.url || "/", "http://localhost").pathname,
    );
    let file = resolve(root, "." + path);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory())
      file = resolve(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(readFileSync(resolve(root, "404.html")));
      return;
    }
    const headers = {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    };
    if (extname(file) === ".zip")
      headers["Content-Disposition"] =
        'attachment; filename="nowhere-nextjs.zip"';
    res.writeHead(200, headers);
    res.end(readFileSync(file));
  } catch {
    res.writeHead(400).end("Invalid request");
  }
}).listen(port, "0.0.0.0", () =>
  console.log(`NOWHERE static export: http://localhost:${port}`),
);

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || 4177);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Usage: node tools/serve-site.js [port]");
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

http.createServer((request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    let requestPath = decodeURIComponent(url.pathname);
    if (requestPath.endsWith("/")) requestPath += "index.html";
    if (requestPath.includes("\\") || requestPath.includes("\0")) {
      throw new Error("invalid path");
    }
    const absolutePath = path.resolve(root, `.${requestPath}`);
    if (!absolutePath.startsWith(`${root}${path.sep}`)) {
      throw new Error("path escaped root");
    }
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) throw new Error("not a file");
    const bytes = fs.readFileSync(absolutePath);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-length": bytes.length,
      "content-type": contentTypes.get(path.extname(absolutePath).toLowerCase()) || "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not found");
  }
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`http://127.0.0.1:${port}/\n`);
});

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { isReadablePublicPath } = require("./public-artifact-policy.js");

const root = path.resolve(__dirname, "..");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".sha256", "text/plain; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

// Resolves only declared HTTP artifacts without following file or ancestor links.
function readPublicArtifact(requestTarget) {
  const requestPath = requestTarget.split("?", 1)[0];
  if (!requestPath.startsWith("/") || /[%\\\0:#]/u.test(requestPath) ||
      requestPath.includes("//") || requestPath.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("invalid path");
  }
  const relativePath = requestPath.slice(1) + (requestPath.endsWith("/") ? "index.html" : "");
  if (!isReadablePublicPath(relativePath)) throw new Error("private or unknown artifact");
  const absolutePath = path.join(root, ...relativePath.split("/"));
  for (let ancestor = absolutePath; ; ancestor = path.dirname(ancestor)) {
    if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error("linked artifact");
    if (ancestor === path.dirname(ancestor)) break;
  }
  if (!fs.statSync(absolutePath).isFile()) throw new Error("not a file");
  return { absolutePath, bytes: fs.readFileSync(absolutePath) };
}

// Creates a loopback preview of the declared public closure, with no repository browsing.
function createPreviewServer() {
  return http.createServer((request, response) => {
    const port = request.socket.localPort;
    if (!["127.0.0.1:" + port, "localhost:" + port].includes(request.headers.host)) {
      response.writeHead(403, { "content-length": 0 });
      response.end();
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD", "content-length": 0 });
      response.end();
      return;
    }
  try {
    const { absolutePath, bytes } = readPublicArtifact(request.url);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-length": bytes.length,
      "content-type": contentTypes.get(path.extname(absolutePath).toLowerCase()) || "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "content-length": 9 });
    response.end(request.method === "HEAD" ? undefined : "not found");
  }
  });
}

// Starts the CLI preview only when this file is the entry point.
function main() {
  const port = Number(process.argv[2] || 4177);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Usage: node tools/serve-site.js [port]");
  }
  createPreviewServer().listen(port, "127.0.0.1", () => {
    process.stdout.write(`http://127.0.0.1:${port}/\n`);
  });
}

if (require.main === module) main();
module.exports = Object.freeze({ createPreviewServer });

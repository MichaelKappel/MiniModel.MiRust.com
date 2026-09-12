"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { once } = require("node:events");
const test = require("node:test");
const { createPreviewServer } = require("./serve-site.js");
const root = path.resolve(__dirname, "..");

// Starts a real ephemeral loopback listener and closes it at the end of the test.
async function preview(t) {
  const server = createPreviewServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return server;
}

// Uses raw HTTP request targets so URL normalization cannot hide hostile paths.
function request(server, target, { method = "GET", host } = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request({ hostname: "127.0.0.1", port, path: target, method,
      headers: { host: host === undefined ? `127.0.0.1:${port}` : host } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode,
        headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("preview serves exact public bytes and body-free HEAD responses", async (t) => {
  const server = await preview(t);
  for (const [route, file, type] of [
    ["/", "index.html", "text/html"],
    ["/styles.css?v=preview", "styles.css", "text/css"],
    ["/updates/", "updates/index.html", "text/html"],
    ["/.well-known/site-release.json", ".well-known/site-release.json", "application/json"],
    ["/docs/file-checksums.sha256", "docs/file-checksums.sha256", "text/plain"],
  ]) {
    const get = await request(server, route);
    assert.equal(get.status, 200, route);
    assert.deepEqual(get.body, fs.readFileSync(path.join(root, file)));
    assert.ok(get.headers["content-type"].startsWith(type));
    assert.equal(get.headers["cache-control"], "no-store");
    assert.equal(get.headers["x-content-type-options"], "nosniff");
    const head = await request(server, route, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers["content-length"]), get.body.length);
  }
  assert.equal((await request(server, "/", { host: `localhost:${server.address().port}` })).status, 200);
});

test("preview excludes private files, source tools, unknown files and traversal", async (t) => {
  const server = await preview(t);
  for (const target of [
    "/.git/HEAD", "/.uai/taboo.uai", "/workspace.uai", "/.htaccess",
    "/deploy/site-deployment-manifest.v1.json", "/tools/serve-site.js", "/ftp.txt",
    "/agent-file-handoff/Content/", "/docs/unreviewed.txt", "/assets/secret.json",
    "/../index.html", "/docs/../index.html", "/%2e%2e/.git/HEAD", "/%2f.git/HEAD",
    "/docs\\catalog-boundary.md", "/index.html::$DATA", "//index.html", "/./index.html",
    "/%", "/%00", "http://localhost/index.html",
  ]) {
    const response = await request(server, target);
    assert.equal(response.status, 404, target);
    assert.equal(response.body.toString(), "not found");
  }
  const head = await request(server, "/.git/HEAD", { method: "HEAD" });
  assert.equal(head.status, 404);
  assert.equal(head.body.length, 0);
});

test("preview rejects foreign hosts and unsupported methods", async (t) => {
  const server = await preview(t);
  for (const host of ["attacker.example", "127.0.0.1:1", "localhost", "127.0.0.1.attacker.example"]) {
    assert.equal((await request(server, "/", { host })).status, 403);
  }
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
    const response = await request(server, "/", { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, "GET, HEAD");
    assert.equal(response.body.length, 0);
  }
});

test("preview refuses links and non-files without disclosing the filesystem error", async (t) => {
  const server = await preview(t);
  const originalLstat = fs.lstatSync;
  for (const linkedPath of [path.join(root, "styles.css"), root]) {
    const mocked = t.mock.method(fs, "lstatSync", (target) => target === linkedPath
      ? { isSymbolicLink: () => true } : originalLstat(target));
    assert.equal((await request(server, "/styles.css")).status, 404);
    mocked.mock.restore();
  }
  const mockedStat = t.mock.method(fs, "statSync", () => ({ isFile: () => false }));
  assert.equal((await request(server, "/styles.css")).status, 404);
  mockedStat.mock.restore();
  t.mock.method(fs, "readFileSync", () => { throw new Error("private filesystem detail"); });
  assert.equal((await request(server, "/styles.css")).body.toString(), "not found");
});

test("CLI rejects invalid ports without starting a listener", () => {
  for (const port of ["0", "-1", "65536", "invalid"]) {
    const result = spawnSync(process.execPath, [path.join(__dirname, "serve-site.js"), port],
      { encoding: "utf8", windowsHide: true, timeout: 5000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});

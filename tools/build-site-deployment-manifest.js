#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repositoryRoot = path.resolve(__dirname, "..");
const contentCommit = process.argv[2];
const outputPath = path.resolve(
  repositoryRoot,
  process.argv[3] || "deploy/site-deployment-manifest.v1.json",
);
const version = "1.1.0";
const stagingRoot = path.join(repositoryRoot, "deploy", "staging", version);
const retiredPaths = [
  "docs/manifest-v0.md",
  "docs/slm-format.md",
  "docs/ui-ux-25-rounds-2026-07-12.md",
  "docs/verifier-mvp.md",
  "examples/minimodel.manifest.v0.example",
  "examples/share-metadata.v0.json",
  "examples/tiny-test-model-q8.minimodel-peer-import-request.json",
  "examples/tiny-test-model-q8.minimodel-peer-offer",
  "examples/tiny-test-model-q8.minimodel.manifest.v0",
];

if (!/^[0-9a-f]{40}$/.test(contentCommit || "")) {
  throw new Error("Usage: node tools/build-site-deployment-manifest.js <40-character-content-commit> [output]");
}

function git(args, encoding = "utf8") {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding,
    maxBuffer: 128 * 1024 * 1024,
  });
}

function isPublicPath(relativePath) {
  const rootFiles = new Set([
    ".htaccess",
    "LICENSE.txt",
    "README.md",
    "index.html",
    "llms-full.txt",
    "llms.txt",
    "robots.txt",
    "sitemap.xml",
    "styles.css",
  ]);
  return (
    rootFiles.has(relativePath) ||
    relativePath.startsWith(".well-known/") ||
    relativePath.startsWith("assets/") ||
    relativePath.startsWith("docs/") ||
    relativePath.startsWith("updates/")
  ) && !relativePath.endsWith("/.gitkeep");
}

git(["cat-file", "-e", `${contentCommit}^{commit}`]);
const sourceTree = git(["rev-parse", `${contentCommit}^{tree}`]).trim();
const tracked = git(["ls-tree", "-r", "--name-only", contentCommit])
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(isPublicPath)
  .sort((left, right) => left.localeCompare(right));

const marker = ".well-known/site-release.json";
const ordered = tracked.filter((item) => item !== marker);
if (tracked.includes(marker)) ordered.push(marker);

const files = ordered.map((relativePath) => {
  const committed = git(["show", `${contentCommit}:${relativePath}`], null);
  const stagedPath = path.join(stagingRoot, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
  fs.writeFileSync(stagedPath, committed);
  return {
    path: relativePath,
    bytes: committed.length,
    sha256: crypto.createHash("sha256").update(committed).digest("hex"),
    https_readback_path: relativePath === ".htaccess" ? null : `/${relativePath}`,
  };
});

if (files.length < 20 || files.length > 45 || files.at(-1)?.path !== marker) {
  throw new Error(`Unexpected public deployment closure: ${files.length} files`);
}

const manifest = {
  schema: "uaix.static_site_deployment_manifest.v1",
  site: "minimodel.mirust.com",
  origin: "https://minimodel.mirust.com",
  version,
  release_date: "2026-08-28",
  source_commit: contentCommit,
  source_tree: sourceTree,
  transport_profile: "MiniModel.MiRust.com",
  files,
  retired_paths: retiredPaths,
  route_smokes: [
    { path: "/", contains: "Version 1.1.0" },
    { path: "/updates/", contains: "1.1.0 - 2026-08-28" },
    { path: "/docs/catalog-boundary.md", contains: "MiniModel Catalog And P2P Boundary" },
    { path: "/docs/memory-endpoints.md", contains: "exactly two separate authorized ecosystem uses" },
    { path: "/.well-known/site-release.json", contains: "minimodel.mirust.com@1.1.0" },
  ],
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`${outputPath}\n${files.length} files\n${stagingRoot}\n`);

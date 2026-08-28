#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repositoryRoot = path.resolve(__dirname, "..");
const contentCommit = process.argv[2];
const outputPath = path.join(repositoryRoot, "docs", "file-checksums.sha256");
const excludedPath = "docs/file-checksums.sha256";

if (!/^[0-9a-f]{40}$/.test(contentCommit || "")) {
  throw new Error("Usage: node tools/build-public-checksums.js <40-character-content-commit>");
}

function git(args, encoding = "utf8") {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding,
    maxBuffer: 64 * 1024 * 1024,
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
const files = git(["ls-tree", "-r", "--name-only", contentCommit])
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((relativePath) => relativePath !== excludedPath && isPublicPath(relativePath))
  .sort((left, right) => left.localeCompare(right))
  .map((relativePath) => {
    const bytes = git(["show", `${contentCommit}:${relativePath}`], null);
    return `${crypto.createHash("sha256").update(bytes).digest("hex")}  ${relativePath}`;
  });

if (files.length < 20 || files.length > 45) {
  throw new Error(`Unexpected public checksum closure size: ${files.length}`);
}

const output = [
  "# MiniModel.MiRust.com public package checksums",
  "# Version: 1.1.0",
  "# Release date: 2026-08-28",
  `# Content-basis commit: ${contentCommit}`,
  `# Content-basis tree: ${sourceTree}`,
  "# This file excludes itself to avoid a recursive checksum.",
  ...files,
  "",
].join("\n");

fs.writeFileSync(outputPath, output, "utf8");
process.stdout.write(`${outputPath}\n${files.length} files\n`);

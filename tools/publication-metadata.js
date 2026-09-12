"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { isDeepStrictEqual } = require("node:util");
const { PUBLIC_ARTIFACT_PATHS } = require("./public-artifact-policy.js");
const repositoryRoot = path.resolve(__dirname, "..");
const marker = ".well-known/site-release.json";
const checksumPath = "docs/file-checksums.sha256";
const retiredPaths = Object.freeze([
  "docs/manifest-v0.md", "docs/slm-format.md", "docs/ui-ux-25-rounds-2026-07-12.md",
  "docs/verifier-mvp.md", "examples/minimodel.manifest.v0.example",
  "examples/share-metadata.v0.json", "examples/tiny-test-model-q8.minimodel-peer-import-request.json",
  "examples/tiny-test-model-q8.minimodel-peer-offer", "examples/tiny-test-model-q8.minimodel.manifest.v0",
]);

/** Fail without printing committed file contents or transport credentials. */
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

/** Read only canonical Git objects; no stage or alternate checkout is created. */
function readCanonicalGit(args) {
  invariant(process.platform === "win32" && repositoryRoot.toLowerCase() ===
    path.resolve("E:/Source/Rust/MiniModel.MiRust.com").toLowerCase(), "Canonical repository location is required");
  for (let cursor = repositoryRoot; ; cursor = path.dirname(cursor)) {
    const stat = fs.lstatSync(cursor);
    invariant(stat.isDirectory() && !stat.isSymbolicLink(), "Canonical repository ancestry is unsafe");
    if (cursor === path.dirname(cursor)) break;
  }
  try {
    return execFileSync("git", ["-c", `safe.directory=${repositoryRoot}`, ...args], {
      cwd: repositoryRoot, maxBuffer: 16 * 1024 * 1024,
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Canonical committed source is unavailable");
  }
}

/** Require a real calendar date, including leap-year and month-length validation. */
function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

/** Bind generated labels to the reviewed release record instead of a hardcoded version. */
function releaseRecord(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  invariant(value && typeof value === "object" && !Array.isArray(value), "Release record is invalid");
  invariant(isDeepStrictEqual(Object.keys(value).sort(), ["schema", "site_id", "origin", "release_id", "version",
    "release_date", "last_publish_date", "updates_path", "status"].sort()), "Release record fields are invalid");
  invariant(value.schema === "uaix.site_release.v1" && value.site_id === "minimodel.mirust.com" &&
    value.origin === "https://minimodel.mirust.com" && value.updates_path === "/updates/",
  "Release record identity is invalid");
  invariant(typeof value.version === "string" && /^(?:0|[1-9]\d{0,3})(?:\.(?:0|[1-9]\d{0,3})){2}$/.test(value.version) &&
    value.release_id === `minimodel.mirust.com@${value.version}` && isDate(value.release_date),
  "Release record version or date is invalid");
  invariant((value.status === "published" || value.status === "prepared") &&
    (value.last_publish_date === null || (isDate(value.last_publish_date) && value.last_publish_date <= value.release_date)) &&
    (value.status !== "published" || value.last_publish_date !== null),
  "Release publication state is invalid");
  return value;
}

/** Build metadata from one bounded, complete commit; the injected reader supports in-memory tests. */
function buildPublicationMetadata(contentCommit, readGit = readCanonicalGit) {
  invariant(typeof contentCommit === "string" && /^[0-9a-f]{40}$/.test(contentCommit), "A full content commit is required");
  invariant(typeof readGit === "function", "Git reader is invalid");
  const read = (args) => {
    const bytes = readGit(args);
    invariant(Buffer.isBuffer(bytes) && bytes.length <= 2 * 1024 * 1024, "Committed artifact exceeds its byte boundary");
    return bytes;
  };
  const top = read(["rev-parse", "--show-toplevel"]).toString("utf8").trim();
  invariant(path.resolve(top).toLowerCase() === repositoryRoot.toLowerCase(), "Git root is not canonical");
  const resolvedCommit = read(["rev-parse", "--verify", `${contentCommit}^{commit}`]).toString("ascii").trim();
  invariant(resolvedCommit === contentCommit, "Content commit identity changed");
  const sourceTree = read(["rev-parse", `${contentCommit}^{tree}`]).toString("ascii").trim();
  invariant(/^[0-9a-f]{40}$/.test(sourceTree), "Source tree identity is invalid");
  const taboo = read(["show", `${contentCommit}:.uai/taboo.uai`]).toString("utf8");
  invariant(taboo.includes("Any committed change to a declared public artifact invalidates deployed-current status"),
    "Committed source-authority policy is missing");
  const entries = read(["ls-tree", "-r", "-z", contentCommit]).toString("utf8").split("\0").filter(Boolean);
  const tracked = new Map();
  for (const entry of entries) {
    const match = /^(\d{6}) (blob|tree|commit) ([0-9a-f]{40})\t(.+)$/.exec(entry);
    invariant(match && !tracked.has(match[4]), "Git tree entry is invalid or duplicated");
    tracked.set(match[4], match[1]);
  }
  const ordered = [...PUBLIC_ARTIFACT_PATHS].sort((left, right) => left.localeCompare(right));
  ordered.splice(ordered.indexOf(marker), 1);
  ordered.push(marker);
  const payloads = new Map();
  let totalBytes = 0;
  const files = ordered.map((relativePath) => {
    invariant(tracked.get(relativePath) === "100644", "Public closure is incomplete or contains a link/executable");
    const bytes = read(["show", `${contentCommit}:${relativePath}`]);
    totalBytes += bytes.length;
    invariant(totalBytes <= 8 * 1024 * 1024, "Public closure exceeds its byte boundary");
    payloads.set(relativePath, bytes);
    return { path: relativePath, bytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      https_readback_path: relativePath === ".htaccess" ? null : `/${relativePath}` };
  });
  const release = releaseRecord(payloads.get(marker));
  const manifest = {
    schema: "uaix.static_site_deployment_manifest.v1", site: "minimodel.mirust.com",
    origin: "https://minimodel.mirust.com", version: release.version, release_date: release.release_date,
    source_commit: contentCommit, source_tree: sourceTree, transport_profile: "MiniModel.MiRust.com",
    files, retired_paths: [...retiredPaths],
    route_smokes: [
      { path: "/", contains: `Version ${release.version}` },
      { path: "/updates/", contains: `${release.version} - ${release.release_date}` },
      { path: "/docs/catalog-boundary.md", contains: "MiniModel Catalog And P2P Boundary" },
      { path: "/docs/memory-endpoints.md", contains: "exactly two separate authorized ecosystem uses" },
      { path: "/.well-known/site-release.json", contains: release.release_id },
    ],
  };
  for (const route of manifest.route_smokes) {
    const relativePath = route.path.endsWith("/") ? route.path.slice(1) + "index.html" : route.path.slice(1);
    const bytes = payloads.get(relativePath);
    invariant(bytes && new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes(route.contains),
      "Route smoke does not match its committed public artifact");
  }
  const checksumLines = files.filter((file) => file.path !== checksumPath)
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((file) => `${file.sha256}  ${file.path}`);
  const checksums = ["# MiniModel.MiRust.com public package checksums", `# Version: ${release.version}`,
    `# Release date: ${release.release_date}`, `# Content-basis commit: ${contentCommit}`,
    `# Content-basis tree: ${sourceTree}`, "# This file excludes itself to avoid a recursive checksum.",
    ...checksumLines, ""].join("\n");
  return { manifest, checksums };
}

/** Read a declared artifact directly from canonical source, refusing linked ancestry. */
function readCanonicalPublicFile(relativePath) {
  invariant(PUBLIC_ARTIFACT_PATHS.includes(relativePath), "Public path is not declared");
  const filename = path.join(repositoryRoot, relativePath);
  for (let cursor = filename; ; cursor = path.dirname(cursor)) {
    const stat = fs.lstatSync(cursor);
    invariant(!stat.isSymbolicLink() && (cursor === filename ? stat.isFile() && stat.size <= 2 * 1024 * 1024 : stat.isDirectory()),
      "Canonical public file ancestry or size is unsafe");
    if (cursor === path.dirname(cursor)) break;
  }
  return fs.readFileSync(filename);
}

/** Require the entire current public closure to match one committed manifest before transport. */
function validatePublicationInputs(manifest, readGit = readCanonicalGit, readPublicFile = readCanonicalPublicFile) {
  invariant(manifest && typeof manifest === "object" && !Array.isArray(manifest), "Deployment manifest is invalid");
  const expected = buildPublicationMetadata(manifest.source_commit, readGit).manifest;
  invariant(isDeepStrictEqual(manifest, expected), "Deployment manifest differs from its committed public closure");
  invariant(typeof readPublicFile === "function", "Public file reader is invalid");
  for (const file of expected.files) {
    const bytes = readPublicFile(file.path);
    invariant(Buffer.isBuffer(bytes) && bytes.length === file.bytes &&
      crypto.createHash("sha256").update(bytes).digest("hex") === file.sha256,
    "Canonical public bytes differ from their committed manifest");
  }
  return expected;
}

module.exports = { buildPublicationMetadata, validatePublicationInputs };

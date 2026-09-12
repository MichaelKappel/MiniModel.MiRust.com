"use strict";

// This explicit closure is shared by preview, checksums and publication.
// New files require deliberate admission instead of inheriting a directory prefix.
const PUBLIC_ARTIFACT_PATHS = Object.freeze([
  ".htaccess",
  ".well-known/site-release-history.json",
  ".well-known/uaix-talisman.txt",
  "assets/exchange-map.svg",
  "assets/site.js",
  "docs/acquisition-contract.md",
  "docs/agent-readme.md",
  "docs/catalog-boundary.md",
  "docs/evidence-boundary.md",
  "docs/file-checksums.sha256",
  "docs/legal-boundary.md",
  "docs/memory-endpoints.md",
  "docs/overview.md",
  "docs/p2p-roadmap.md",
  "docs/peer-companion.md",
  "docs/slm2-composition.md",
  "docs/source-lanes.md",
  "index.html",
  "LICENSE.txt",
  "llms-full.txt",
  "llms.txt",
  "README.md",
  "robots.txt",
  "sitemap.xml",
  "styles.css",
  "updates/index.html",
  ".well-known/site-release.json",
]);
const publicPaths = new Set(PUBLIC_ARTIFACT_PATHS);

// Tests exact repository-relative paths; Apache configuration is publishable.
function isPublicPath(relativePath) {
  return publicPaths.has(relativePath);
}

// Server configuration belongs in publication but is never an HTTP response.
function isReadablePublicPath(relativePath) {
  return relativePath !== ".htaccess" && isPublicPath(relativePath);
}

module.exports = Object.freeze({ PUBLIC_ARTIFACT_PATHS, isPublicPath, isReadablePublicPath });

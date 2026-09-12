"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { PUBLIC_ARTIFACT_PATHS, isPublicPath, isReadablePublicPath } = require("./public-artifact-policy.js");

test("shared public policy preserves the reviewed 27-file publication closure", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,
    "../deploy/site-deployment-manifest.v1.json"), "utf8"));
  assert.deepEqual([...PUBLIC_ARTIFACT_PATHS].sort(), manifest.files.map((file) => file.path).sort());
  for (const file of manifest.files) {
    assert.equal(isPublicPath(file.path), true);
    assert.equal(isReadablePublicPath(file.path), file.path !== ".htaccess");
  }
});

test("new files in public-looking directories are private until explicitly admitted", () => {
  for (const candidate of ["docs/credentials.json", "assets/private.js",
    ".well-known/private.txt", "updates/source.js", ".git/HEAD", ".uai/taboo.uai",
    "docs/../index.html", "./index.html", "/index.html", "INDEX.HTML", null, undefined]) {
    assert.equal(isPublicPath(candidate), false);
    assert.equal(isReadablePublicPath(candidate), false);
  }
});

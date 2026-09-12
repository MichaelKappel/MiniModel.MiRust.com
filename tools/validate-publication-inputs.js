"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { validatePublicationInputs } = require("./publication-metadata.js");

// Validate canonical metadata and bytes without writing a local deployment stage.
try {
  if (process.argv.length !== 2) throw new Error("No manifest or output override is allowed");
  const filename = path.resolve(__dirname, "../deploy/site-deployment-manifest.v1.json");
  for (let cursor = filename; ; cursor = path.dirname(cursor)) {
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink() || !(cursor === filename ? stat.isFile() && stat.size <= 2 * 1024 * 1024 : stat.isDirectory())) {
      throw new Error("Canonical manifest ancestry or size is unsafe");
    }
    if (cursor === path.dirname(cursor)) break;
  }
  const manifest = validatePublicationInputs(JSON.parse(fs.readFileSync(filename, "utf8")));
  process.stdout.write(JSON.stringify({ valid: true, files: manifest.files.length, source_commit: manifest.source_commit }) + "\n");
} catch (error) {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
}

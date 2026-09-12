#!/usr/bin/env node
"use strict";
const { buildPublicationMetadata } = require("./publication-metadata.js");

// Emit metadata only; callers never receive a copied source/package tree.
try {
  if (process.argv.length !== 3) throw new Error("Expected one full content commit and no output argument");
  const result = buildPublicationMetadata(process.argv[2]);
  process.stdout.write(JSON.stringify(result.manifest, null, 2) + "\n");
} catch (error) {
  process.stderr.write(`MiniModel metadata generation failed: ${error.message}\n`);
  process.exitCode = 1;
}

"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const test = require("node:test");
const { buildPublicationMetadata, validatePublicationInputs } = require("./publication-metadata.js");
const { PUBLIC_ARTIFACT_PATHS } = require("./public-artifact-policy.js");
const root = path.resolve(__dirname, "..");
const commit = "1".repeat(40);
const tree = "2".repeat(40);
const closedCommit = "e52df2cf0c5d77519a870211f1e63c5b77b90705";
const reviewedCommit = "b221f32cceff8a5a77cae7e63830f36c9215a837";

// Provide minimal non-product data in memory instead of synthesizing another repository.
function fixture(overrides = {}) {
  const release = { schema: "uaix.site_release.v1", site_id: "minimodel.mirust.com",
    origin: "https://minimodel.mirust.com", release_id: "minimodel.mirust.com@1.1.1",
    version: "1.1.1", release_date: "2026-09-12", last_publish_date: "2026-08-28",
    updates_path: "/updates/", status: "prepared", ...overrides.release };
  const entries = PUBLIC_ARTIFACT_PATHS.map((file) => "100644 blob " + "3".repeat(40) + "\t" + file);
  const page = (file) => ({
    "index.html": `Version ${release.version}`,
    "updates/index.html": `${release.version} - ${release.release_date}`,
    "docs/catalog-boundary.md": "MiniModel Catalog And P2P Boundary",
    "docs/memory-endpoints.md": "exactly two separate authorized ecosystem uses",
  }[file] || "bounded synthetic metadata\n");
  const records = new Map([
    [JSON.stringify(["rev-parse", "--show-toplevel"]), Buffer.from(root)],
    [JSON.stringify(["rev-parse", "--verify", commit + "^{commit}"]), Buffer.from(commit)],
    [JSON.stringify(["rev-parse", commit + "^{tree}"]), Buffer.from(tree)],
    [JSON.stringify(["show", commit + ":.uai/taboo.uai"]), Buffer.from("Any committed change to a declared public artifact invalidates deployed-current status")],
    [JSON.stringify(["ls-tree", "-r", "-z", commit]), Buffer.from(entries.join("\0") + "\0")],
    ...PUBLIC_ARTIFACT_PATHS.map((file) => [JSON.stringify(["show", commit + ":" + file]),
      Buffer.from(file === ".well-known/site-release.json" ? JSON.stringify(release) : page(file))]),
  ]);
  return { records, entries, read(args) { const result = records.get(JSON.stringify(args)); assert.ok(result, "Unexpected Git read"); return result; } };
}

test("metadata derives its current version and excludes private or checksum-self paths", () => {
  const input = fixture();
  input.records.set(JSON.stringify(["ls-tree", "-r", "-z", commit]),
    Buffer.from([...input.entries, "100644 blob " + "4".repeat(40) + "\t.uai/private.uai"].join("\0") + "\0"));
  const result = buildPublicationMetadata(commit, input.read);
  assert.equal(result.manifest.version, "1.1.1");
  assert.equal(result.manifest.release_date, "2026-09-12");
  assert.equal(result.manifest.files.length, 27);
  assert.equal(result.manifest.files.at(-1).path, ".well-known/site-release.json");
  assert.equal(result.manifest.files.find((file) => file.path === ".htaccess").https_readback_path, null);
  assert.equal(result.manifest.files.some((file) => file.path === ".uai/private.uai"), false);
  assert.equal(result.checksums.split("\n").filter((line) => /^[a-f0-9]{64}  /.test(line)).length, 26);
  assert.doesNotMatch(result.checksums, /  docs\/file-checksums.sha256/);
  assert.match(result.checksums, /Version: 1.1.1/);
  assert.deepEqual(result.manifest.route_smokes[0], { path: "/", contains: "Version 1.1.1" });
});

test("metadata catches a route-smoke heading mismatch before any publication", () => {
  const input = fixture();
  input.records.set(JSON.stringify(["show", commit + ":docs/catalog-boundary.md"]), Buffer.from("Different heading"));
  assert.throws(() => buildPublicationMetadata(commit, input.read), /Route smoke does not match/);
});

test("metadata refuses missing, linked, duplicated, oversized or foreign source identities", () => {
  const transforms = [
    (f) => f.records.set(JSON.stringify(["rev-parse", "--show-toplevel"]), Buffer.from(path.dirname(root))),
    (f) => f.records.set(JSON.stringify(["rev-parse", "--verify", commit + "^{commit}"]), Buffer.from("9".repeat(40))),
    (f) => f.records.set(JSON.stringify(["rev-parse", commit + "^{tree}"]), Buffer.from("invalid")),
    (f) => f.records.set(JSON.stringify(["show", commit + ":.uai/taboo.uai"]), Buffer.from("missing policy")),
    (f) => f.records.set(JSON.stringify(["ls-tree", "-r", "-z", commit]), Buffer.from(f.entries.slice(1).join("\0") + "\0")),
    (f) => f.records.set(JSON.stringify(["ls-tree", "-r", "-z", commit]), Buffer.from(f.entries.join("\0").replace("100644", "120000") + "\0")),
    (f) => f.records.set(JSON.stringify(["ls-tree", "-r", "-z", commit]), Buffer.from([...f.entries, f.entries[0]].join("\0") + "\0")),
    (f) => f.records.set(JSON.stringify(["ls-tree", "-r", "-z", commit]), Buffer.from("malformed\0")),
    (f) => f.records.set(JSON.stringify(["show", commit + ":.htaccess"]), Buffer.alloc(2 * 1024 * 1024 + 1)),
    (f) => { for (const file of PUBLIC_ARTIFACT_PATHS) f.records.set(JSON.stringify(["show", commit + ":" + file]), Buffer.alloc(400000)); },
  ];
  for (const transform of transforms) { const input = fixture(); transform(input); assert.throws(() => buildPublicationMetadata(commit, input.read)); }
  for (const value of [undefined, "HEAD", "A".repeat(40), "1".repeat(39), "--help"]) {
    assert.throws(() => buildPublicationMetadata(value, () => { throw new Error("must not read"); }), /full content commit/);
  }
  assert.throws(() => buildPublicationMetadata(commit, null), /Git reader/);
  assert.throws(() => buildPublicationMetadata(commit, () => "not a buffer"), /byte boundary/);
});

test("release records reject unsupported identity, dates and publication claims", () => {
  for (const release of [
    { schema: "old" }, { site_id: "foreign" }, { origin: "https://foreign.invalid" }, { updates_path: "/wrong" },
    { version: "1.1" }, { version: "01.1.1" }, { release_id: "wrong" }, { release_date: "2026-02-30" },
    { last_publish_date: "2026-09-13" }, { status: "unknown" }, { status: "published", last_publish_date: null },
    { obsolete_field: true },
  ]) { const input = fixture({ release }); assert.throws(() => buildPublicationMetadata(commit, input.read)); }
  const input = fixture({ release: { status: "published", version: "1.1.0", release_id: "minimodel.mirust.com@1.1.0", release_date: "2026-08-28" } });
  assert.equal(buildPublicationMetadata(commit, input.read).manifest.version, "1.1.0");
});

test("publication preflight binds every canonical byte and all manifest fields", () => {
  const input = fixture();
  const manifest = buildPublicationMetadata(commit, input.read).manifest;
  const readFile = (file) => input.read(["show", commit + ":" + file]);
  assert.deepEqual(validatePublicationInputs(manifest, input.read, readFile), manifest);
  for (const change of [
    (m) => { m.files.pop(); }, (m) => { m.files[0].path = "private.uai"; },
    (m) => { m.files[0].https_readback_path = "https://foreign.invalid"; },
    (m) => { m.origin = "https://foreign.invalid"; }, (m) => { m.source_tree = "9".repeat(40); },
    (m) => { m.retired_paths = ["README.md"]; }, (m) => { m.route_smokes[0].contains = "arbitrary"; },
    (m) => { m.extra = true; },
  ]) {
    const mutated = structuredClone(manifest); change(mutated);
    assert.throws(() => validatePublicationInputs(mutated, input.read, readFile), /committed public closure/);
  }
  for (const reader of [() => Buffer.from("wrong"), () => "wrong", () => Buffer.alloc(2 * 1024 * 1024 + 1)]) {
    assert.throws(() => validatePublicationInputs(manifest, input.read, reader), /Canonical public bytes/);
  }
  assert.throws(() => validatePublicationInputs(manifest, input.read, null), /Public file reader/);
  assert.throws(() => validatePublicationInputs(null, input.read, readFile), /manifest is invalid/);
});

test("policy-bound canonical Git reproduces the historical public bytes without a copied stage", () => {
  const expected = JSON.parse(execFileSync("git", ["-c", `safe.directory=${root}`, "show",
    reviewedCommit + ":deploy/site-deployment-manifest.v1.json"], { cwd: root, encoding: "utf8", windowsHide: true }));
  assert.equal(expected.source_commit, closedCommit);
  assert.throws(() => buildPublicationMetadata(closedCommit), /source-authority policy is missing/);
  const result = buildPublicationMetadata(reviewedCommit);
  assert.deepEqual(result.manifest.files, expected.files);
  assert.deepEqual(result.manifest.route_smokes, expected.route_smokes);
  assert.equal(result.manifest.version, expected.version);
  assert.equal(result.manifest.source_commit, reviewedCommit);
  const canonicalFiles = new Map(PUBLIC_ARTIFACT_PATHS.map((file) => [file, fs.readFileSync(path.join(root, file))]));
  const currentInput = fixture();
  for (const [file, bytes] of canonicalFiles) currentInput.records.set(JSON.stringify(["show", commit + ":" + file]), bytes);
  const currentManifest = buildPublicationMetadata(commit, currentInput.read).manifest;
  assert.deepEqual(validatePublicationInputs(currentManifest, currentInput.read), currentManifest);
  for (const [tool, field] of [["build-site-deployment-manifest.js", "manifest"], ["build-public-checksums.js", "checksums"]]) {
    const actual = execFileSync(process.execPath, [path.join(__dirname, tool), reviewedCommit], { cwd: root, encoding: "utf8", windowsHide: true });
    assert.equal(actual, field === "manifest" ? JSON.stringify(result.manifest, null, 2) + "\n" : result.checksums);
    const rejected = spawnSync(process.execPath, [path.join(__dirname, tool), reviewedCommit, "forbidden-output"], { cwd: root, encoding: "utf8", windowsHide: true });
    assert.equal(rejected.status, 1);
    assert.equal(rejected.stdout, "");
    assert.match(rejected.stderr, /no output argument/);
    assert.equal(fs.existsSync(path.join(root, "forbidden-output")), false);
  }
});

# MiniModel Rust Verifier MVP

The first implementation target is a local Rust verifier. It proves manifest fields and local `.slm` bytes before any peer networking exists.

## Current Implementation

The first verifier workspace lives in the MiniModel.org source repository:

- `crates/minimodel-core`: parser, boundary checks, SHA256, chunk/Merkle verification, TinyRustLM `.slm` validation, peer-piece export/reassembly, and receipt writing.
- `crates/minimodel`: CLI wrapper for developer use.
- `examples/tiny-test-model-q8.minimodel.manifest.v0`: real q8 fixture manifest.

The verifier does not download model bytes. `verify-artifact` opens only the local artifact path supplied by the user.

## Crates and Binaries

| Component | Role |
| --- | --- |
| `minimodel-core` | Parser, normalized manifest model, checksums, boundary checks, artifact verification, chunk checks, evidence checks, and receipt writing. |
| `minimodel` | CLI wrapper around `minimodel-core`. |
| `minimodel-tests` | Fixtures, drift cases, and receipt round trips. |

The first pass uses standard-library Rust and line-oriented parsing. Networking, relays, DHTs, desktop UI, and peer identity exchange are later phases.

## Commands

```text
minimodel verify-manifest <manifest>
minimodel verify-artifact <manifest> <artifact.slm>
minimodel write-import-receipt <manifest> <artifact.slm> <receipt.minimodel-receipt>
minimodel export-peer-pieces <manifest> <artifact.slm> <output-dir>
minimodel assemble-peer-pieces <manifest> <piece-dir> <output.slm>
minimodel prepare-peer-share <artifact.slm> <output-dir> <model-id> [source-huggingface-model-id]
minimodel add-peer-source <catalog-entry-json> <output-json> <known-peer-base-url>
minimodel write-peer-source-announcement <catalog-entry-json> <announcement-json> <known-peer-base-url>
minimodel apply-peer-source-announcements <catalog-entry-json> <output-json> <announcement-json>...
minimodel write-catalog-snapshot-with-announcements <output-json> <catalog-entry-json>... --announcements <announcement-json>...
minimodel write-peer-source-announcement-feed <output-json> <announcement-json>...
minimodel write-catalog-snapshot-with-announcement-feed <output-json> <feed-route> <announcement-feed-json> <catalog-entry-json>...
minimodel write-catalog-snapshot <output-json> <catalog-entry-json>...
```

`verify-manifest` checks schema, required fields, boundary fields, license/model-card routes, route shape, source lanes, and signature placeholder rules.

`verify-artifact` additionally checks local file byte count, SHA256, optional chunk metadata, Merkle root, and TinyRustLM `.slm` compatibility.

`write-import-receipt` only succeeds after `verify-artifact` passes.

`export-peer-pieces` only succeeds after `verify-artifact` passes. It writes local chunk files plus `minimodel.peer_piece_set.v0`, binding manifest checksum, artifact checksum, chunk SHA256 rows, chunk-list SHA256, and Merkle root.

`assemble-peer-pieces` verifies each local chunk, assembles a temporary `.slm`, reruns the full artifact verifier, and only then writes the accepted output file. This is a transport-shaped local primitive, not live networking.

## Verification Stages

### 1. Manifest Parse

The parser should:

- accept UTF-8 text
- split on the first `=`
- trim line endings
- reject duplicate keys
- reject non-ASCII keys
- reject unknown manifest versions
- reject comments in signed manifests
- reject missing required fields
- reject values that exceed documented size limits

The parser should not execute anything from the manifest.

### 2. Boundary Parse

The boundary checker should require:

- `artifact.project_server_url=none`
- `artifact.kind=slm`
- `artifact.acquisition=user-local-file`, `user-external-download`, or `consent-peer-transfer`
- license route
- model-card route
- publisher identity
- artifact byte count
- artifact SHA256

It should reject:

- project server model-byte URLs
- server-side execution claims
- install hooks
- script hooks
- automatic browser-fetch fields
- project-owned Hugging Face token requirements

### 3. Source-Lane Parse

The verifier should treat source discovery as metadata.

Allowed source lanes:

- `local-file`
- `local-list`
- `huggingface-hub`
- `minimodel-p2p`
- `unknown`

The lane does not change the artifact rule. The artifact must still be a local user-supplied path before import receipt writing.

### 4. Local Artifact Verification

The verifier opens only the path supplied by the user.

It checks:

- local file exists
- local file is not a directory
- byte count equals `artifact.byte_count`
- SHA256 equals `artifact.sha256`
- chunk metadata is valid when present
- Merkle root matches when chunk mode is enabled
- `.slm` magic is `SLM1`
- `.slm` version is supported
- `.slm` custom checksum passes
- tokenizer checksum matches manifest
- tensor-layout checksum matches manifest
- quantization matches manifest
- runtime compatibility field is supported

### 5. Evidence Verification

Evidence verification is initially local and optional. If evidence files are supplied, the verifier should check the route/checksum pairs and reject drift.

For passed evidence statuses, route and checksum fields are required.

For pending or unavailable evidence statuses, the verifier must not promote the model to a stronger claim.

### 6. Receipt

The receipt is local and line-oriented.

Required receipt fields:

| Field | Meaning |
| --- | --- |
| `receipt.version` | Receipt schema version. |
| `receipt.kind` | `minimodel.import_receipt`. |
| `receipt.created_utc` | Local verification time. |
| `manifest.sha256` | SHA256 of manifest file. |
| `manifest.model_id` | Copied model id. |
| `artifact.local_path_hint` | Basename only, not a public path. |
| `artifact.byte_count` | Verified local bytes. |
| `artifact.sha256` | Verified artifact SHA256. |
| `slm.validation_status` | `passed`. |
| `slm.model_shape` | Verified shape. |
| `slm.quantization` | Verified quantization. |
| `slm.tokenizer_checksum` | Verified tokenizer checksum. |
| `slm.tensor_layout_checksum` | Verified layout checksum. |
| `evidence.status` | Summary of available evidence. |
| `import.next_gate` | `user-selected-tinyrustlm-local-file-open`. |

Receipts must not contain model bytes, public model-byte URLs, private local absolute paths, or claims that MiniModel endorses the artifact.

### 7. Peer-Piece Export and Assembly

Peer-piece export and assembly are local operations that exercise the same byte contract future P2P must preserve.

Export writes:

- `minimodel.peer_piece_set.v0`
- one fixed-size piece file per manifest chunk
- manifest checksum
- artifact checksum
- piece file names
- piece offsets
- piece byte counts
- piece SHA256 values
- chunk-list SHA256
- Merkle root

Assembly rejects:

- missing piece-set fields
- manifest checksum drift
- artifact identity drift
- unsafe piece file names
- piece byte-count drift
- piece SHA256 drift
- assembled artifact byte/SHA256 drift
- invalid `.slm` bytes

The piece files are model bytes. They must not be uploaded to MiniModel.com or MiniModel.MiRust.com.

## Drift Tests

The MVP test suite should include one passing fixture and failures for:

- missing license route
- missing model-card route
- project-server model-byte URL present
- server-side execution claim present
- artifact byte-count drift
- artifact SHA256 drift
- tokenizer checksum drift
- tensor-layout checksum drift
- unsupported artifact kind
- unsupported quantization
- duplicate key
- route without checksum for passed evidence
- checksum without route for passed evidence
- project-owned Hugging Face token requirement
- Hugging Face `/resolve/` represented as project artifact URL
- remote inference requirement
- chunk count drift
- Merkle root drift
- signature payload drift when signatures are enabled

## TinyRustLM Handoff

The verifier does not push files into TinyRustLM. It produces a receipt and tells the user which local `.slm` file passed.

TinyRustLM continues to load only files selected through the browser file picker. Rust/WASM remains the final `.slm` validation authority in the browser.

## Developer Commands

From the MiniModel.org workspace:

```powershell
cargo run -p minimodel -- verify-manifest examples\tiny-test-model-q8.minimodel.manifest.v0
cargo run -p minimodel -- verify-artifact examples\tiny-test-model-q8.minimodel.manifest.v0 ..\SLMComposer.com\tinyrustlm\models\tiny-test-model-q8.slm
cargo run -p minimodel -- write-import-receipt examples\tiny-test-model-q8.minimodel.manifest.v0 ..\SLMComposer.com\tinyrustlm\models\tiny-test-model-q8.slm .\tiny-test-model-q8.minimodel-receipt
cargo run -p minimodel -- export-peer-pieces examples\tiny-test-model-q8.minimodel.manifest.v0 ..\SLMComposer.com\tinyrustlm\models\tiny-test-model-q8.slm .\peer-pieces\tiny-test-model-q8
cargo run -p minimodel -- serve-peer-pieces examples\tiny-test-model-q8.minimodel.manifest.v0 .\peer-pieces\tiny-test-model-q8 127.0.0.1:8123
cargo run -p minimodel -- fetch-peer-pieces examples\tiny-test-model-q8.minimodel.manifest.v0 http://127.0.0.1:8123/ .\peer-pieces\fetched-tiny-test-model-q8
cargo run -p minimodel -- assemble-peer-pieces examples\tiny-test-model-q8.minimodel.manifest.v0 .\peer-pieces\tiny-test-model-q8 .\tiny-test-model-q8.from-pieces.slm
cargo run -p minimodel -- import-peer-request .\tiny-test-model-q8.minimodel-peer-import-request.json examples\tiny-test-model-q8.minimodel.manifest.v0 .\imported-tiny-test-model-q8
cargo run -p minimodel -- prepare-peer-share ..\SLMComposer.com\tinyrustlm\models\tiny-test-model-q8.slm .\prepared-share\tiny-test-model-q8 tinyrustlm/prepared-tiny-test-model-q8 tinyrustlm/tiny-test-model-q8
cargo run -p minimodel -- write-catalog-entry examples\tiny-test-model-q8.minimodel.manifest.v0 examples\tiny-test-model-q8.minimodel-peer-offer .\catalog-entry.v0.json
cargo run -p minimodel -- add-peer-source .\catalog-entry.v0.json .\catalog-entry.with-peer.v0.json http://127.0.0.1:8123/
cargo run -p minimodel -- write-peer-source-announcement .\catalog-entry.v0.json .\catalog-entry.peer-source-announcement.v0.json http://127.0.0.1:8123/
cargo run -p minimodel -- apply-peer-source-announcements .\catalog-entry.v0.json .\catalog-entry.announced-peer.v0.json .\catalog-entry.peer-source-announcement.v0.json
cargo run -p minimodel -- write-catalog-snapshot-with-announcements .\models.v0.json .\catalog-entry.v0.json --announcements .\catalog-entry.peer-source-announcement.v0.json
cargo run -p minimodel -- write-peer-source-announcement-feed .\peer-source-announcements.v0.json .\catalog-entry.peer-source-announcement.v0.json
cargo run -p minimodel -- write-catalog-snapshot-with-announcement-feed .\models.v0.json peer-source-announcements.v0.json .\peer-source-announcements.v0.json .\catalog-entry.v0.json
cargo run -p minimodel -- write-catalog-snapshot .\models.v0.json .\catalog-entry.with-peer.v0.json
```

The receipt stores only the artifact basename as `artifact.local_path_hint`; it must not store private absolute paths.

`add-peer-source` is the safe late-publication step for a proof-ready catalog entry. It attaches one validated consenting direct peer URL, rejects MiniModel/TinyRustLM/project hosts, revalidates the peer-source count, and writes a new catalog entry for `write-catalog-snapshot`. It does not upload, proxy, download, or serve model bytes through project infrastructure.

`write-peer-source-announcement` is the portable late-publication step. It writes metadata-only JSON that binds the catalog entry checksum, model id, artifact identity, peer-offer proof, Merkle root, and one consenting direct peer URL. `apply-peer-source-announcements` is the maintainer merge step: it validates one or more announcements against the catalog entry, rejects drift, deduplicates peer URLs, and writes the with-peer catalog entry used by the next metadata-only snapshot. `write-catalog-snapshot-with-announcements` is the maintainer batch step: it validates many entries and announcement files together, rejects unmatched announcement model ids, and writes final `models.v0.json` directly.

`write-peer-source-announcement-feed` validates many portable announcements into one metadata-only `minimodel.peer_source_announcement_catalog` feed. `write-catalog-snapshot-with-announcement-feed` validates that feed, confirms every feed model id has a matching catalog entry, rejects unsafe URL-like feed routes, computes the feed SHA-256 from the exact JSON bytes, and writes a same-origin route row into `models.v0.json`. TinyRustLM verifies that small feed before it upgrades proof-ready rows to `P2P Import`; the actual model bytes still come only from local files or consenting peers through Rust `import-peer-request`.

## Later Networking Boundary

Future peer transfer can reuse manifest, peer-piece, and receipt fields, but it must not weaken local verification. A future peer app may fetch chunks from consenting peers. MiniModel.com servers still publish only metadata, schemas, public-key routes, and takedown/contact routes.

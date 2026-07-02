# MiniModel Rust Verifier MVP

The first implementation target is a local Rust verifier. It proves manifest fields and local `.slm` bytes before any peer networking exists.

## Current Implementation

The first verifier workspace lives in the MiniModel.org source repository:

- `crates/minimodel-core`: parser, boundary checks, SHA256, chunk/Merkle verification, TinyRustLM `.slm` validation, and receipt writing.
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
```

`verify-manifest` checks schema, required fields, boundary fields, license/model-card routes, route shape, source lanes, and signature placeholder rules.

`verify-artifact` additionally checks local file byte count, SHA256, optional chunk metadata, Merkle root, and TinyRustLM `.slm` compatibility.

`write-import-receipt` only succeeds after `verify-artifact` passes.

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
```

The receipt stores only the artifact basename as `artifact.local_path_hint`; it must not store private absolute paths.

## Later Networking Boundary

Future peer transfer can reuse manifest and receipt fields, but it must not weaken local verification. A future peer app may fetch chunks from consenting peers. MiniModel.com servers still publish only metadata, schemas, public-key routes, and takedown/contact routes.

# MiniModel Manifest v0 Draft

The MiniModel manifest v0 is the first implementable schema for a metadata-only tiny model exchange. It is designed for a small Rust parser, local artifact verification, and later peer transfer.

It is not a server fetch contract.

## Format

The MVP manifest is a UTF-8 text file with one `key=value` field per line.

Rules:

- Lines are LF or CRLF terminated.
- Empty lines are ignored.
- Comments are allowed in examples only.
- Signed manifests must reject comments.
- Keys are lowercase ASCII with dot separators.
- Values are trimmed ASCII unless a field explicitly allows UTF-8.
- Duplicate keys are rejected.
- SHA256 values use `sha256:` followed by 64 uppercase hexadecimal characters.
- The signed canonical form sorts all non-signature keys lexicographically, uses LF endings, and ends with one trailing LF.

The line-oriented format matches TinyRustLM evidence sidecars and keeps the first verifier small.

## Required Fields

| Field | Requirement |
| --- | --- |
| `manifest.version` | Must be `0`. |
| `manifest.kind` | Must be `minimodel.manifest`. |
| `manifest.schema_id` | Must be `minimodel.manifest.v0`. |
| `manifest.schema_checksum` | SHA256 of the published schema text or schema key list. |
| `manifest.created_utc` | UTC timestamp from the publisher. |
| `model.id` | Stable route-safe model id. |
| `model.version` | Publisher version string. |
| `publisher.id` | Route-safe publisher id. |
| `publisher.key_id` | Public key identity for signatures. |
| `model_card.route` | Metadata route, never model bytes. |
| `license.route` | License or license-evidence route. |
| `artifact.kind` | Must be `slm` for the first verifier. |
| `artifact.byte_count` | Decimal byte count for the local `.slm` file. |
| `artifact.sha256` | SHA256 of the local `.slm` file. |
| `artifact.acquisition` | `user-local-file`, `user-external-download`, or `consent-peer-transfer`. |
| `artifact.project_server_url` | Must be `none`. |
| `slm.format_version` | Expected `.slm` format version. |
| `slm.model_shape` | Shape id or shape summary. |
| `slm.quantization` | `f32`, `q8_0`, `q4_0`, or a later registered value. |
| `slm.tokenizer_checksum` | Tokenizer checksum from `.slm` validation evidence. |
| `slm.tensor_layout_checksum` | Tensor-layout checksum from `.slm` validation evidence. |
| `runtime.compatibility` | Runtime family, for example `tinyrustlm`. |
| `runtime.minimum_version` | Minimum runtime version expected by the publisher. |
| `source.kind` | `safetensors`, `slm-native`, `synthetic`, or `unknown`. |
| `source.id` | Source checkpoint, recipe, or local source id. |
| `source.revision` | Source revision, commit, digest, or `unknown`. |
| `evidence.admission.status` | `passed`, `pending`, or `unavailable`. |
| `signature.kind` | `unsigned-draft` or a registered signature envelope. |

## Evidence Fields

Evidence fields are route/checksum pairs. When a status claims `passed`, the matching route and checksum must exist.

| Field group | Purpose |
| --- | --- |
| `source.config.route`, `source.config.sha256` | Source configuration evidence. |
| `source.tokenizer.route`, `source.tokenizer.sha256` | Tokenizer evidence. |
| `evidence.source_review.route`, `evidence.source_review.sha256` | Pre-extraction source review. |
| `evidence.source_validation.route`, `evidence.source_validation.sha256` | Source validation sidecar. |
| `evidence.runtime_smoke.route`, `evidence.runtime_smoke.sha256` | Runtime smoke sidecar. |
| `evidence.eval.route`, `evidence.eval.sha256` | Eval sidecar. |
| `evidence.admission.route`, `evidence.admission.sha256` | Admission sidecar. |

The verifier rejects a checksum without a route, a route without a checksum for passed evidence, and any route that claims to be a project-hosted model-byte route.

## Source Discovery Fields

These fields distinguish local, Hugging Face, and future P2P discovery without changing the local verification contract.

| Field | Values |
| --- | --- |
| `source.discovery.kind` | `local-file`, `local-list`, `huggingface-hub`, `minimodel-p2p`, or `unknown`. |
| `source.discovery.route` | Metadata or model-card route only. |
| `source.discovery.revision` | External source revision, commit, or `unknown`. |
| `source.huggingface_model_id` | Hugging Face model id when the verified `.slm` came from a reviewed Hub checkpoint. |
| `source.discovery.user_token_required` | `true` only when a user-supplied external credential is required. |

Project-owned tokens are forbidden for user artifact acquisition.

Hugging Face `/resolve/`, LFS/Xet/CAS transfers, Inference Providers, Inference Endpoints, and executable Spaces are not MiniModel server capabilities. They may inform user-side discovery or external acquisition only.

TinyRustLM may save a `minimodel.huggingface_conversion_request.v0` JSON file when Hub metadata has no admitted `.slm` match. That file is not a manifest and not an execution grant. It is a local handoff for review, conversion, validation, admission, and later P2P availability metadata.

TinyRustLM may also save a `.tinyrustlm-convert.ps1` handoff script for the same Hub record. The script is not MiniModel metadata and not a download grant. It is a local wrapper around Rust packer commands: `inspect-safetensors`, `plan-safetensors-source`, `convert-safetensors-trained`, `validate`, `validate-manifest`, `peer-offer`, and `validate-peer-offer`. It must require a user-owned local `.safetensors` path and must not download model bytes.

The Rust `peer-offer` output is a text manifest, usually named `.minimodel-peer-offer`, with SHA256 artifact identity, fixed-size chunk SHA256 rows, chunk-list SHA256, and a Merkle root. It proves what a future peer client must transfer and what the recipient must reverify before local browser import. It is not executable code and not a project-hosted artifact URL.

After local `.slm` verification, TinyRustLM may save a `minimodel.local_slm_share_metadata.v0` JSON bundle. It contains a catalog-entry candidate and `minimodel.peer_offer.v0` metadata with artifact SHA256, chunk SHA256 entries, chunk-list SHA256, and Merkle root. Catalog entries may also point at a Rust-generated `.minimodel-peer-offer` using `peer_offer_route`, `peer_offer_sha256`, `peer_offer_chunk_count`, and `peer_offer_merkle_root_sha256`. It must keep peer transfer marked unavailable until networking is actually implemented.

## Chunk Fields

Chunk fields are reserved for the later peer-transfer phase. The local-only verifier still parses and validates them when present.

| Field | Requirement |
| --- | --- |
| `chunks.mode` | `none` or `fixed-size-merkle-v0`. |
| `chunks.size` | Decimal bytes per chunk when chunking is enabled. |
| `chunks.count` | Decimal chunk count when chunking is enabled. |
| `chunks.merkle_root_sha256` | Merkle root over chunk SHA256 values. |
| `chunks.list.route` | Optional metadata route for chunk hashes, not model bytes. |
| `chunks.list.sha256` | Checksum for the chunk list metadata. |

For `chunks.mode=none`, the verifier skips chunk verification but still verifies whole-artifact byte count and SHA256.

For `fixed-size-merkle-v0`, the verifier should:

1. Verify chunk size is nonzero.
2. Verify chunk count agrees with artifact byte count.
3. Verify the chunk-list metadata checksum when provided.
4. Hash each received or supplied chunk.
5. Recompute the Merkle root from chunk SHA256 values.
6. Reject mismatches before `.slm` validation.

## Signature Fields

The MVP may publish unsigned examples, but fields are reserved now.

| Field | Requirement |
| --- | --- |
| `signature.kind` | `unsigned-draft` or a registered signature scheme. |
| `signature.key_id` | Publisher key id, or `none` for unsigned drafts. |
| `signature.public_key_route` | Metadata route for public-key material. |
| `signature.payload_sha256` | SHA256 of the canonical non-signature manifest body. |
| `signature.value` | Encoded signature value, or `none` for unsigned drafts. |

Signature support should bind the manifest body, publisher identity, and key route. It does not certify model safety or legality.

## Rejection Rules

The first verifier rejects manifests that:

- include a project-server URL for model bytes
- require server-side execution
- omit license route or model-card route
- declare artifact kind other than `slm`
- mismatch artifact byte count or SHA256
- mismatch tokenizer checksum
- mismatch tensor-layout checksum
- mismatch runtime evidence, eval evidence, source-review evidence, source-validation evidence, runtime-smoke evidence, or admission evidence
- contain remote code hooks
- contain install commands
- contain scripts, post-load callbacks, or automatic browser-fetch instructions
- claim project endorsement
- claim legal cleanliness, training cleanliness, safety, or fitness for purpose as a project guarantee
- require a project-owned Hugging Face token
- represent a Hugging Face `/resolve/` URL as a MiniModel-hosted artifact

## Verification Order

1. Parse line fields and reject duplicate keys.
2. Verify required schema and boundary fields.
3. Verify license and model-card routes.
4. Verify source-lane fields.
5. Verify signature fields when not `unsigned-draft`.
6. Verify chunk metadata when enabled.
7. Verify local artifact byte count and SHA256.
8. Verify `.slm` header, checksum, tokenizer checksum, tensor layout checksum, shape, and quantization.
9. Verify evidence sidecar checksums when local evidence is supplied.
10. Write a local import receipt.

The manifest alone never authorizes TinyRustLM to fetch bytes. The user must supply the local artifact.

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
- SHA256 values use `sha256:` followed by 64 hexadecimal characters. The verifier normalizes hex case.
- The signed canonical form sorts all non-signature keys lexicographically, uses LF endings, and ends with one trailing LF.

The line-oriented format matches TinyRustLM evidence sidecars and keeps the first verifier small.

The first real fixture manifest is [../examples/tiny-test-model-q8.minimodel.manifest.v0](../examples/tiny-test-model-q8.minimodel.manifest.v0). It binds the TinyRustLM q8 fixture to artifact SHA256, `.slm` checksum, tokenizer checksum, tensor-layout checksum, peer-offer route, chunk-list SHA256, and Merkle root without hosting the model bytes.

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

TinyRustLM may also save a `.tinyrustlm-convert.ps1` handoff script for the same Hub record. The script is not MiniModel metadata and not a download grant. It is a local wrapper around `tinyrustlm-slm-pack convert-huggingface-request`, which consumes the saved request plus a user-owned local `.safetensors` path, writes a verified `.slm`, and writes a checksum-bound conversion receipt. The same script then calls MiniModel `prepare-peer-share` to write proof-ready metadata. If a consenting peer URL is available, the script can run `add-peer-source` for a local with-peer entry and `write-peer-source-announcement` for portable availability metadata; a catalog maintainer can later run `apply-peer-source-announcements` or batch `write-catalog-snapshot-with-announcements` before publication. It must not download model bytes.

The Rust `peer-offer` output is a text manifest, usually named `.minimodel-peer-offer`, with SHA256 artifact identity, fixed-size chunk SHA256 rows, chunk-list SHA256, and a Merkle root. It proves what a future peer client must transfer and what the recipient must reverify before local browser import. It is not executable code and not a project-hosted artifact URL.

After local `.slm` verification, TinyRustLM may save a `minimodel.local_slm_share_metadata.v0` JSON bundle. It contains a catalog-entry candidate and `minimodel.peer_offer.v0` metadata with artifact SHA256, chunk SHA256 entries, chunk-list SHA256, and Merkle root. Catalog entries may also point at a Rust-generated `.minimodel-peer-offer` using `peer_offer_route`, `peer_offer_sha256`, `peer_offer_chunk_count`, and `peer_offer_merkle_root_sha256`. It must keep peer transfer marked unavailable until networking is actually implemented.

MiniModel can also attach peer-source availability after conversion with:

```text
minimodel add-peer-source <catalog-entry-json> <output-json> <known-peer-base-url>
```

That command validates the existing catalog entry, rejects project-server peer hosts, writes one consenting direct-peer source, revalidates `peer_source_count`, and writes a new catalog-entry JSON for the next metadata-only snapshot. It does not upload, proxy, or fetch `.slm` bytes.

For portable late-publication, MiniModel can write and apply peer-source announcements:

```text
minimodel write-peer-source-announcement <catalog-entry-json> <announcement-json> <known-peer-base-url>
minimodel apply-peer-source-announcements <catalog-entry-json> <output-json> <announcement-json>...
minimodel write-catalog-snapshot-with-announcements <output-json> <catalog-entry-json>... --announcements <announcement-json>...
minimodel write-peer-source-announcement-feed <output-json> [announcement-json...]
minimodel write-catalog-snapshot-with-announcement-feed <output-json> <feed-route> <announcement-feed-json> <catalog-entry-json>...
```

The announcement binds the catalog-entry checksum, model id, artifact byte count, artifact SHA256, peer-offer SHA256, Merkle root, and one consenting direct-peer URL. The apply command rejects model, artifact, and proof drift; deduplicates peer URLs; writes `peer_sources`; and revalidates the entry before the next metadata-only `write-catalog-snapshot` publication. The batch command validates many entries and announcements together, rejects unmatched announcement model ids, and writes final metadata-only `models.v0.json` directly. TinyRustLM can also load a proof-ready local `models.v0.json` snapshot, apply a local peer-source announcement JSON as a browser metadata overlay, and offer `P2P Import` for the matching Hugging Face row without fetching project-hosted model bytes. This is how a converted model can become P2P-ready for later users without rerunning conversion or hosting bytes on project servers.

`write-peer-source-announcement-feed` validates zero or more portable announcement JSON files into one `minimodel.peer_source_announcement_catalog` metadata feed. An empty feed is valid and means no consenting peer sources are currently published. `write-catalog-snapshot-with-announcement-feed` validates the feed, confirms every feed model id exists in the supplied catalog entries, computes the feed body SHA-256, rejects URL-like or unsafe feed routes, and writes the checksum-bound feed route into `models.v0.json`.

Shared catalog snapshots may advertise peer-source announcement feeds as checksum-bound metadata routes. Use `peer_source_announcement_route` with `peer_source_announcement_sha256`, or `peer_source_announcement_routes` / `peer_source_announcement_feeds` arrays whose entries carry a route and SHA-256. TinyRustLM resolves those routes relative to the catalog URL, requires the route origin to match the catalog origin, verifies the feed body hash, then applies valid announcements to proof-ready entries. These feeds must not contain model bytes, project-hosted artifact URLs, Hugging Face `/resolve/` URLs, or execution claims.

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

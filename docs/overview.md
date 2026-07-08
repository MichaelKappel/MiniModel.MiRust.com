# MiniModel.com Developer Overview

MiniModel.com is a Rust-first metadata and verification layer for tiny local AI model packages. The project is intentionally not a model host and not an inference service.

MiniModel.MiRust.com is the developer documentation site for MiniModel.com. It explains the `.slm` format, the MiniModel manifest, the local verifier, source lanes, legal boundaries, and the future peer-to-peer model exchange architecture.

## Core Rule

Project servers never run user model bytes.

Project servers never serve user model bytes.

Project servers may serve:

- static documentation
- schema files and examples
- metadata-only catalog entries
- public-key routes
- signed catalog snapshots
- model-card and license routes when they are metadata only
- takedown and contact routes

Project servers must not serve:

- third-party `.slm` files
- safetensors, GGUF, ONNX, adapter packages, tokenizer binaries, or other user model artifacts
- server-side inference endpoints for user models
- model-byte proxy routes
- automatic browser fetch instructions for model artifacts
- project-owned Hugging Face tokens for user downloads

## Product Roles

MiniModel.com is the product and catalog identity for tiny local model exchange.

MiniModel.MiRust.com is the developer documentation route.

TinyRustLM.com is the browser-local runtime where users import local `.slm` files with the browser file picker.

TinyRustLM.MiRust.com is the TinyRustLM developer portal.

## First Implementable Shape

The first deliverable is not networking. It is now a small, durable verification stack:

1. `.slm` format reference.
2. MiniModel manifest v0 schema.
3. Local Rust verifier in `minimodel-core` and the `minimodel` CLI.
4. Local import receipt with basename-only artifact path hints.
5. Direct known-peer serve/fetch/import commands that still require full Rust re-verification.
6. Offline receiver request/preflight inspection, peer-status checks, and final receipt-chain inspection with receiver-validation gates before TinyRustLM browser import.
7. `write-peer-companion-state` metadata, `write-peer-companion-inventory` summaries with duplicate contact-endpoint rejection, `write-peer-contact-card` known-peer URL cards, `serve-peer-companion` state/status serving, and `check-peer-status` readiness checks for a future local companion wrapper around verified shares.
8. Metadata-only catalog examples, `add-peer-source` for direct late peer availability, peer-source announcement/apply commands, announcement-feed publication, and batch snapshot publication for maintainer-reviewed availability.
9. Clear legal and consent boundaries.

TinyRustLM can export local share metadata bundles from verified `.slm` imports, the Rust packer can write `.minimodel-peer-offer` proof manifests, and the MiniModel verifier can export, serve, fetch, import, reassemble peer pieces with full re-verification, and write companion-readable state for a verified share. Completed peer imports now write receipt evidence for the direct peer transport, peer URL, validated receiver-validation contract gates, piece-set SHA-256, companion-state status, chunk/Merkle contract, fetched peer-piece bytes, assembled-from-peer-pieces status, and no-project-server-byte flags. `inspect-import-receipt` and `inspect-peer-import-receipt` bind that receipt back to the assembled artifact, saved request, saved preflight evidence, and strict UTC order before browser import. Broader peer networking can then reuse the same manifest, chunk, Merkle, piece, peer-source, state, receiver-gate, and receipt contract.

The protected TinyRustLM NuGet SDK is the .NET ecosystem bridge for local adoption. It exposes `.slm` validation, runtime harness operations, local share-kit preparation, metadata-bound manifest inspection, local manifest-piece assembly into a verified `.slm`, `<output.slm>.p2p-import-receipt.json` sidecar writing, and receipt-sidecar inspection against a caller-supplied local `.slm`. It intentionally does not expose private conversion, quantization authoring, adapter authoring, training, peer discovery, premium routing, or model-ranking logic.

## Source Lanes

MiniModel has three source lanes:

- User local files: the simplest and first-class route.
- Hugging Face discovery: user-triggered external metadata, source context, conversion-request JSON, optional local Rust conversion-script handoff, `convert-huggingface-request`, and MiniModel share metadata output.
- Local share metadata: checksum-bound JSON exported only after a verified local `.slm` import.
- Peer-offer proof: Rust-generated text manifest binding the converted `.slm` to artifact SHA256, chunk SHA256 rows, and a Merkle root.
- Local peer pieces: chunk files plus `minimodel.peer_piece_set.v0` exported, served, fetched, imported, and reassembled through Rust verification.
- Protected NuGet SDK: .NET apps can verify local share-kit pieces and write plus inspect local P2P import receipt sidecars without using project-hosted model bytes or private TinyRustLM authoring internals.
- MiniModel catalog metadata: proof-ready entries, metadata-only snapshots, metadata-only peer contact cards for reviewed known-peer URLs, `add-peer-source` rows for consenting direct peers, peer-source announcements that maintainers can drift-check before publication, checksum-bound announcement feeds, and batch snapshot generation from announcement files.
- Future P2P exchange: broader discovery and consent-based chunk transfer verified locally before import.

All source lanes converge on the same rule: the user controls the local artifact, Rust verifies it locally, and TinyRustLM loads only a user-selected local `.slm` file.

Hugging Face rows are not compatible by default. They become TinyRustLM-runnable only after a compatible source is converted to `.slm`, validated locally, and imported through the browser file picker. TinyRustLM's generated `.tinyrustlm-convert.ps1` script is a local wrapper around Rust packer commands and does not download model bytes.

## Converted-Once Publication

A converted model becomes easier for later users only after metadata and peer availability are published honestly. TinyRustLM's `Save P2P Share Kit` is one local bridge: after a verified `.slm` import it saves metadata plus a script that verifies the local artifact, runs `prepare-peer-share`, optionally writes announcement/feed metadata, writes metadata-only catalog snapshots, and prints the user's own `serve-peer-companion` or `serve-peer-pieces` command. When a consenting peer URL is known, the same local scripts may write `write-peer-contact-card` output so a receiver can load the reviewed URL card instead of pasting it manually. The contact card is metadata-only and does not publish catalog availability. The direct local path is `add-peer-source`: it upgrades one proof-ready catalog entry with one consenting direct peer URL. The portable maintainer path is `write-peer-source-announcement` plus `apply-peer-source-announcements`: a converter writes a small JSON availability claim, and a maintainer validates model identity, peer-offer route, proof checksum, chunk count, and Merkle root against the catalog entry before the next `write-catalog-snapshot`. For many entries, `write-catalog-snapshot-with-announcements` validates entries and announcements together and writes final `models.v0.json` directly. For browser-visible late availability without rewriting catalog entries, `write-peer-source-announcement-feed` validates zero or more portable announcements into one metadata-only feed and `write-catalog-snapshot-with-announcement-feed` binds the same-origin feed route into `models.v0.json` with SHA-256. Empty feeds are valid availability checks but do not make rows P2P-ready. None of these paths upload model bytes to MiniModel.com.

TinyRustLM may also follow a catalog-declared peer-source announcement feed when the snapshot binds that feed route to SHA-256 and the route stays on the catalog origin. That fetch is metadata-only and only upgrades matching proof-ready rows to `P2P Import` after the feed envelope, duplicate model/peer rules, and peer-offer route/checksum/chunk-count/Merkle match pass; empty feeds simply confirm that no peer source is published yet. Actual `.slm` bytes still come from local files or a consenting peer through Rust verification.

## Optional Peer Companion

The optional MiniModel Peer Companion is a later user-run desktop app, not a hosted exchange. Its role would be to make advanced peer work understandable: local peer identity, local piece stores, serve/fetch controls, cache quotas, consent prompts, transfer/import receipts, and handoff back to TinyRustLM after verification.

The companion should reuse the same Rust verifier crates and command contracts as the CLI. `write-peer-companion-state` is the first metadata artifact shaped for that UI layer: it gives a future wrapper checksums, piece count, Merkle root, peer URL, and boundary flags without moving model bytes. `write-peer-companion-inventory` layers receipt-ledger, piece-store, serve-plan, and contact-card metadata on top of that state and rejects duplicate contact-card peer URLs before a UI can present one endpoint as multiple peers. `write-peer-contact-card` is the lighter identity/contact artifact: it gives TinyRustLM or a future companion a reviewed known-peer URL and label, while Rust still owns import verification. `serve-peer-companion` is the matching current CLI serving primitive: it validates that state and exposes the metadata-only peer-status route, companion-state route, and allow-listed piece routes, including path-prefixed peer base URLs. `inspect-peer-import-request`, `check-peer-status`, `preflight-peer-import-request`, and `inspect-peer-import-preflight` let receivers validate request, route, receiver-gate, status, and companion metadata before piece transfer. Receiver-side import validates advertised state before trusting the peer transfer, and the completed receipt carries the transfer evidence a companion UI should display only after `inspect-import-receipt` and `inspect-peer-import-receipt` bind it back to the assembled artifact, request, and preflight evidence. Tauri v2 can be evaluated later if web UI reuse matters, but only with strict capabilities and narrow Rust commands. Pure Rust UI options and broader transports such as Iroh/QUIC, Rust-libp2p, WebRTC, WebTransport, BitTorrent-style chunking, Pear, Bare, and Hypercore remain research lanes.

Detailed companion planning lives in [peer-companion.md](peer-companion.md). It is roadmap documentation, not a live companion claim.

## Trust Model

MiniModel should be understood as a pointer and evidence system:

- A catalog entry points at metadata.
- A manifest binds metadata to a specific artifact checksum.
- Evidence sidecars bind conversion, runtime-smoke, eval, and admission results.
- A local verifier proves the artifact supplied by the user.
- A local share metadata bundle and peer-offer proof record artifact and chunk hashes without moving model bytes.
- A local peer-piece set records the exact chunks a future peer transport must carry, while keeping those model-byte chunks outside project servers.
- A receipt records what was verified locally.

None of those steps mean MiniModel endorses the model, certifies training data, or guarantees safety.

## Why `.slm`

`.slm` is the TinyRustLM execution format. It is deliberately static, versioned, little-endian, and small enough for strict Rust/WASM validation. It avoids runtime dependence on large external model containers in the browser. Safetensors and other source formats can be reviewed and converted locally, but the browser runtime executes `.slm`.

## Documentation Map

- `slm-format.md`: binary file details, tokenizer sections, tensor directory, checksum, quantization, adapters, conversion and admission chain.
- `catalog-boundary.md`: metadata-only catalog and direct known-peer boundary.
- `manifest-v0.md`: MiniModel line-oriented manifest fields and rejection rules.
- `verifier-mvp.md`: implemented local Rust verifier MVP and receipt fields.
- `source-lanes.md`: local files, Hugging Face discovery, local share metadata, peer-offer proof, and future P2P.
- `legal-boundary.md`: consent, liability, moderation, and takedown language.
- `p2p-roadmap.md`: Rust-first transfer roadmap and ecosystem tradeoffs.
- `agent-readme.md`: operating notes for AI agents and automation.

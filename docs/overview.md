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
5. Metadata-only catalog examples.
6. Clear legal and consent boundaries.

After those are stable, TinyRustLM can export local share metadata bundles from verified `.slm` imports, and the Rust packer can write `.minimodel-peer-offer` proof manifests. Peer networking can then reuse the same manifest, chunk, Merkle, and receipt contract.

## Source Lanes

MiniModel has three source lanes:

- User local files: the simplest and first-class route.
- Hugging Face discovery: user-triggered external metadata, source context, conversion-request JSON, optional local Rust conversion-script handoff, and `.minimodel-peer-offer` proof output.
- Local share metadata: checksum-bound JSON exported only after a verified local `.slm` import.
- Peer-offer proof: Rust-generated text manifest binding the converted `.slm` to artifact SHA256, chunk SHA256 rows, and a Merkle root.
- Future P2P exchange: consent-based chunk transfer verified locally before import.

All source lanes converge on the same rule: the user controls the local artifact, Rust verifies it locally, and TinyRustLM loads only a user-selected local `.slm` file.

Hugging Face rows are not compatible by default. They become TinyRustLM-runnable only after a compatible source is converted to `.slm`, validated locally, and imported through the browser file picker. TinyRustLM's generated `.tinyrustlm-convert.ps1` script is a local wrapper around Rust packer commands and does not download model bytes.

## Trust Model

MiniModel should be understood as a pointer and evidence system:

- A catalog entry points at metadata.
- A manifest binds metadata to a specific artifact checksum.
- Evidence sidecars bind conversion, runtime-smoke, eval, and admission results.
- A local verifier proves the artifact supplied by the user.
- A local share metadata bundle and peer-offer proof record artifact and chunk hashes without moving model bytes.
- A receipt records what was verified locally.

None of those steps mean MiniModel endorses the model, certifies training data, or guarantees safety.

## Why `.slm`

`.slm` is the TinyRustLM execution format. It is deliberately static, versioned, little-endian, and small enough for strict Rust/WASM validation. It avoids runtime dependence on large external model containers in the browser. Safetensors and other source formats can be reviewed and converted locally, but the browser runtime executes `.slm`.

## Documentation Map

- `slm-format.md`: binary file details, tokenizer sections, tensor directory, checksum, quantization, adapters, conversion and admission chain.
- `manifest-v0.md`: MiniModel line-oriented manifest fields and rejection rules.
- `verifier-mvp.md`: implemented local Rust verifier MVP and receipt fields.
- `source-lanes.md`: local files, Hugging Face discovery, local share metadata, peer-offer proof, and future P2P.
- `legal-boundary.md`: consent, liability, moderation, and takedown language.
- `p2p-roadmap.md`: Rust-first transfer roadmap and ecosystem tradeoffs.
- `agent-readme.md`: operating notes for AI agents and automation.

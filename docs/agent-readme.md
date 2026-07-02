# AI Agent Readme

This file is written for AI coding agents and documentation agents working on MiniModel.com, MiniModel.MiRust.com, TinyRustLM.com, or related Rust workspaces.

## Non-Negotiable Rules

- Project servers never run user model bytes.
- Project servers never serve user model bytes.
- Project servers never proxy external model-byte downloads.
- MiniModel docs and catalogs are metadata-only.
- TinyRustLM remains browser-local.
- Users import local `.slm` files through the browser file picker.
- Rust owns `.slm` validation and checksum verification.
- Long-term memory remains pointer-based and checksum-bearing.

## Correct Mental Model

MiniModel is not a model CDN.

MiniModel is not an inference service.

MiniModel is not a safety certifier.

MiniModel is a pointer, manifest, evidence, and verification layer.

## Preferred Implementation Order

1. Keep documentation current.
2. Keep manifest schemas explicit.
3. Build local verification before networking.
4. Add tests for drift and rejection cases.
5. Write receipts only after local verification passes.
6. Add metadata-only catalog entries.
7. Export local share metadata only after verified `.slm` import.
8. Prototype P2P later.

## Source-Lane Language

Use:

- Your Local Files
- Hugging Face
- P2P Exchange

Do not imply that Hugging Face endpoints are MiniModel execution paths.

Do say that Hugging Face rows are external metadata until an admitted `.slm` exists. TinyRustLM may save a conversion-request JSON and a local `.tinyrustlm-convert.ps1` script, but the user must obtain and review source bytes outside project infrastructure, then Rust must convert and validate the local `.slm` and write/validate a `.minimodel-peer-offer` proof.

Do not imply that MiniModel P2P is already live unless it is implemented and deployed.

It is accurate to say TinyRustLM can save `minimodel.local_slm_share_metadata.v0` after verified local `.slm` import when that feature is deployed. That bundle is metadata, not a model transfer.

## Manifest Safety

Never add fields that cause automatic model-byte fetches by project servers or browsers.

Reject:

- install commands
- scripts
- post-load callbacks
- project-hosted artifact URLs
- project-owned external tokens
- server inference requirements

## `.slm` Safety

Do not parse `.slm` bytes in ad hoc JavaScript when Rust validation is available.

Do not treat SHA256 alone as enough for runtime acceptance. The TinyRustLM `.slm` validator also checks header shape, custom checksum, tokenizer, tensor layout, dtype payloads, quantization scales, and required tensors.

## Documentation Deploy Rule

Before deploying any public site, ensure documentation sites that describe the behavior are updated first. After edits, run relevant pointer audits and `git diff --check`.

## Credential Rule

Do not write FTP passwords, API keys, tokens, or private credentials into:

- docs
- commits
- manifests
- logs
- final answers
- workspace memory

Use existing local credential stores without exposing plaintext.

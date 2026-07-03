# MiniModel Peer Companion Design

This page is the compact MiniModel.MiRust.com mirror for the optional MiniModel Peer Companion. The full canonical source specification lives at:

<https://minimodel.org/docs/peer-companion.md>

Status: roadmap only. Do not claim the companion is live until a signed local application, CLI-equivalent verification tests, consent flows, and release documentation exist.

## Boundary

- Project servers never run user model bytes.
- Project servers never serve user model bytes.
- Project servers never proxy Hugging Face, peer, or local model-byte downloads.
- The companion is user-run local software, not MiniModel.org infrastructure.
- Rust owns manifest parsing, `.slm` validation, chunk verification, peer-piece assembly, and receipt writing.
- JavaScript or a WebView shell must not become a second trust path for model bytes.
- Every serve, fetch, import, cache, or availability-publish action requires explicit user consent.

## Product Job

The companion should make advanced peer work understandable without replacing the simple browser path. It may eventually manage:

- verified local `.slm` share preparation
- local peer-piece storage
- start/stop controls for a user-owned piece server
- peer-source announcement writing
- direct known-peer import with Rust verification
- cache quotas and local transfer logs
- import receipts
- TinyRustLM handoff after verification

TinyRustLM still imports a local user-selected `.slm` through the browser file picker.

## Source Lanes

Local files remain the easiest path: the user supplies a `.slm`, MiniModel verifies it locally, and TinyRustLM opens the same local file.

Hugging Face remains metadata and user-side acquisition context. The companion may organize local conversion requests, but it must not use project-owned tokens, proxy `/resolve/` routes, or treat Hub model-card rows as runnable.

P2P import still ends in local Rust verification. The current receiver command is:

```text
minimodel import-peer-request <request-json> <manifest> <output-dir>
```

The companion may wrap that command with progress and logs, but it must preserve the same model-id, byte-count, artifact SHA-256, peer-offer, chunk, Merkle, `.slm`, and receipt checks.

## Architecture Direction

Keep the verifier independent of presentation:

```text
presentation -> application use cases -> verifier/domain
transport/storage adapters -> application use cases -> verifier/domain
```

Tauri v2 is plausible only as a shell around narrow Rust commands with strict capabilities. Iced, Slint, egui, Dioxus, Iroh/QUIC, Rust-libp2p, WebRTC, WebTransport, BitTorrent-style chunking, Pear, Bare, and Hypercore remain evaluation lanes until they preserve consent, local verification, and no-server-byte rules.

## Completion Gate

A first prototype is credible only when it:

- reuses MiniModel Rust verifier logic
- prepares a share from a verified local `.slm`
- starts and stops a local known-peer serve session
- imports from a consenting direct peer
- writes the same receipt semantics as the CLI
- refuses project-server model-byte paths
- exposes clear consent prompts
- has domain tests for drift and unsafe URL rejection
- has docs that preserve the no-server-byte boundary

See the full design for local state, piece-store rules, peer identity, transport phases, UI requirements, testing, release, and open questions:

<https://minimodel.org/docs/peer-companion.md>

# MiniModel.MiRust.com

MiniModel.MiRust.com is the prelaunch developer and protocol documentation site
for MiniModel.org. MiniModel is a metadata catalog and direct P2P discovery
system for locally verified SLM2 compositions. It is not a hosted model,
conversion, relay, or inference service.

## Current Boundary

MiniModel.org publishes bounded catalog and peer-announcement metadata. It does not proxy model bytes.
Exact qualified bytes move directly between consenting
peers; when no exact qualified peer is available, an installed local companion
may perform an explicit conversion from a pinned and verified public source.

Catalog rows bind cryptographic identities and evidence references. They do
not by themselves prove model quality, current peer availability,
outside-network reachability, browser execution, or publication.

## Protocol Requirements

- Bind one exact SLM2 composition identity and exact member/piece digests.
- Do not mix pieces from different composition or piece-set identities.
- Verify each piece and every completed member before atomic installation.
- Keep peer consent, bounded concurrency, cancellation, durable progress, and
  typed terminal failures explicit.
- Keep prompts, credentials, local paths, invitation URLs, and model bytes out
  of project-site logs and receipts.
- Treat local, loopback, LAN, fixture, and mocked checks as local evidence only.

## MemoryEndpoints.com

MemoryEndpoints.com has two separate authorized ecosystem uses:

1. Ecosystem agents use it directly for agent-to-agent long-term memory,
   meetings, handoffs, and coordination across all maintained sites.
2. Separately, the TinyRustLM.com Connect plugin lets a user sign in and
   explicitly select MemoryEndpoints.com as TinyRustLM.com Connect long-term
   memory.

Keep the lanes separately identified, authenticated, consented, scoped, and
evidenced. MemoryEndpoints.com is not a MiniModel model-byte transport or peer
relay. Prelaunch memory may also be duplicated in current `.uai`, wiki,
public-safe source notes, and approved private stores while every maintained
copy remains current, secret-safe, provenance-labeled, and noncontradictory.

## Publication

- Last published: `1.1.0`.
- Release date: `2026-08-28`.
- Update: retired obsolete `.slm`, manifest-v0, verifier-MVP, fixture, and
  instruction-handoff authority; published the current direct P2P, SLM2,
  privacy, evidence, and two-use MemoryEndpoints contracts.

Public readback requires a clean committed source revision, complete site
gates, deployment from that revision, and exact HTTPS verification. A source
change or reachable development page is not publication.

## Routes

- Catalog: <https://MiniModel.org/>
- Developer documentation: <https://MiniModel.MiRust.com/>
- Catalog boundary: `/docs/catalog-boundary.md`

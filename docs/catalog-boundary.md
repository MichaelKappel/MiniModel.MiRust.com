# MiniModel Catalog And P2P Boundary

MiniModel.org publishes bounded discovery metadata for direct P2P exchange of
qualified SLM2 compositions and is authorized to provide their initial server
seeds. It does not proxy arbitrary model downloads, run inference, perform
server-side conversion, or certify model quality.

## Required Identities

A current catalog record binds:

- public model and immutable source revision;
- source lock, license, and provenance;
- exact SLM2 composition and profile identity;
- exact member names, sizes, and cryptographic digests;
- qualification and minimum-runtime evidence identities;
- fixed piece boundaries and per-piece hashes; and
- expiring peer announcements with explicit consent and lane identity.

Identity aliases may improve display or search but must not identify different
bytes. Qualification, peer availability, transfer, installation, browser
execution, and publication remain separate claims.

## Deterministic Route

Restore a usable cached composition or automatically acquire a small qualified
starter from a MiniModel.org server seed. Bytes use the same exact identity and
verification rules as any consenting peer. Keep local-file import, Hugging
Face, local conversion and manual peer/IP configuration in Advanced. An
installed companion performs pinned conversion only when requested. Do not hide route
changes, silently retry alternate peers, use remote inference, or substitute an
instruction-file download.

Import verifies identity before mixing pieces, bounds concurrency and ranges,
checks every cryptographic piece digest, preserves durable progress, verifies
completed members, and activates only after the entire composition passes.

## Privacy And Evidence

MiniModel.org serves approved seed bytes; prompts stay local. Public metadata and
receipts exclude credentials, invitation URLs, local paths, and raw private
evidence. Local, loopback, LAN, fixture, mocked, and configured states are not
outside-network proof.

## MemoryEndpoints Separation

MemoryEndpoints.com has two authorized ecosystem uses: direct agent-to-agent
long-term memory, meetings, handoffs, and coordination across all maintained
sites; and, separately, a TinyRustLM.com Connect user plugin through which a
user signs in and explicitly selects MemoryEndpoints.com as TinyRustLM.com
Connect long-term memory.

Those lanes keep identity, credentials, consent, scopes, provenance, and
receipts separate. MemoryEndpoints.com is not part of MiniModel model-byte
transfer or peer relay. Prelaunch memory copies in current `.uai`, wiki,
public-safe source notes, and approved private stores are allowed only while
all maintained copies remain current, secret-safe, provenance-labeled, and
noncontradictory.

## Publication

- Prepared: `1.1.1`, dated `2026-09-12`; initial server seeds, cached/default
  startup and Advanced acquisition controls are documented.
- Last published: `1.1.0`, on `2026-08-28`.
- A qualified starter and live server seed have not yet been established.

Exact public readback is required before this source change may be described as
deployed or published.

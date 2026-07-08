# Source Lanes

MiniModel supports three source lanes. They are intentionally separate in the user experience and in the manifest.

All lanes converge on local verification.

## Lane 1: User Local Files

This is the first-class path.

The user supplies:

- a local `.slm` file
- optionally a local MiniModel manifest
- optionally local evidence sidecars
- optionally a local catalog list

The local verifier proves the file, writes a receipt, and the user opens the same `.slm` in TinyRustLM through the browser file picker.

Advantages:

- easiest for new users
- no account
- no network dependency
- no project server byte handling
- simplest privacy story
- easiest to debug

Advanced capabilities can be layered behind disclosure:

- show manifest fields
- show artifact SHA256
- show `.slm` checksum
- show tokenizer checksum
- show tensor-layout checksum
- show evidence sidecars
- show receipt fields

## Lane 2: Hugging Face Discovery

Hugging Face is an external discovery and acquisition ecosystem. MiniModel should treat it as a source of metadata, model-card context, file hints, source revisions, and user-side acquisition options.

Allowed MiniModel behavior:

- show a Hugging Face model id
- show a model-card route
- show a license route
- show a source revision or commit
- show expected source config/tokenizer checksums
- show whether a user-supplied Hugging Face token may be required outside MiniModel
- show warnings about remote execution products
- save a local conversion-request JSON when no admitted `.slm` metadata exists yet
- save an optional `.tinyrustlm-convert.ps1` local script that runs Rust packer commands against user-owned local source files and emits a peer-offer proof
- show MiniModel metadata matches when a reviewed Hugging Face checkpoint has already produced an admitted `.slm`

Forbidden MiniModel server behavior:

- project-owned tokens for user downloads
- proxying `/resolve/` model files
- caching Hugging Face model bytes on project servers
- serving converted user model bytes
- representing Inference Providers, Inference Endpoints, or Spaces as MiniModel runtime paths

Hugging Face Inference Providers and Inference Endpoints are remote execution services. They may be useful to users outside MiniModel, but they are not the TinyRustLM or MiniModel execution path.

Executable Spaces are also outside the MiniModel runtime path.

The MiniModel path is:

1. User reviews metadata.
2. If no admitted `.slm` exists, the user saves a local `minimodel.huggingface_conversion_request.v0` handoff.
3. The user may also save a `.tinyrustlm-convert.ps1` script. It runs `tinyrustlm-slm-pack convert-huggingface-request` locally against the saved request plus a user-owned `.safetensors` file.
4. A user or converter acquires source bytes outside project infrastructure if they choose.
5. Conversion writes a local `.slm`, then Rust validates byte count, checksum, shape, tokenizer, runtime smoke, and admission evidence, and writes `tinyrustlm-conversion.receipt`.
6. `minimodel prepare-peer-share` emits a MiniModel manifest, `.minimodel-peer-offer` text proof, local peer pieces, and catalog-entry JSON in one directory.
7. `minimodel write-peer-companion-state` validates that prepared share and writes metadata-only state for a future local companion UI, including checksums, piece count, Merkle root, a consenting direct peer URL, and no-project-server-byte flags.
8. `minimodel serve-peer-companion` validates the state against the manifest and peer-piece directory before serving `minimodel.peer_status.v0.json`, `minimodel.peer_companion_state.v0.json`, and allow-listed piece routes from the user machine, including under a validated path prefix such as `/peer-pieces/`.
9. `minimodel write-peer-contact-card` can write a metadata-only reviewed known-peer URL card for receivers; TinyRustLM can load it to set Known peer URL, but Rust still verifies before import.
10. If a consenting peer URL becomes known later, `minimodel add-peer-source` can attach one validated direct-peer source to the proof-ready entry before the next snapshot.
11. If availability metadata needs to travel between a converter and a catalog maintainer, `minimodel write-peer-source-announcement` writes portable metadata, `minimodel apply-peer-source-announcements` validates model and peer-offer route/checksum/chunk-count/Merkle drift before merging peer sources, and `minimodel write-catalog-snapshot-with-announcements` batch-publishes many entries plus announcements into metadata-only `models.v0.json`.
12. If the maintainer wants browser-visible late availability without rewriting catalog entries, `minimodel write-peer-source-announcement-feed` validates zero or more portable announcements into a metadata-only feed and `minimodel write-catalog-snapshot-with-announcement-feed` binds that same-origin feed route into `models.v0.json` with SHA-256. TinyRustLM validates the feed envelope, duplicate model/peer rules, and matching peer-offer proof fields before applying peer sources. An empty feed is a valid checked state and does not make rows P2P-ready.
13. `minimodel write-catalog-snapshot` can publish metadata-only `models.v0.json` from proof-ready or with-peer catalog entries.
14. `serve-peer-companion`, `serve-peer-pieces`, `inspect-peer-import-request`, `check-peer-status`, `preflight-peer-import-request`, `inspect-peer-import-preflight`, `fetch-peer-pieces`, `assemble-peer-pieces`, `import-peer-request`, `inspect-import-receipt`, and `inspect-peer-import-receipt` exercise the current direct known-peer byte path, with offline request validation, metadata-only peer-status validation, route/gate contract validation, advertised companion-state validation, and full Rust re-verification before local browser import; completed peer imports append peer URL, validated receiver-validation contract gates, piece-set SHA-256, companion-state status, chunk/Merkle contract, fetched peer-piece bytes, assembled-from-peer-pieces status, and no-project-server-byte flags to the local receipt, then bind the receipt back to the request and preflight evidence before TinyRustLM import.
15. TinyRustLM may export `minimodel.local_slm_share_metadata.v0` with the verified artifact SHA256, chunk hashes, chunk-list SHA256, Merkle root, and peer-offer reference.
16. TinyRustLM may also export a local `.minimodel-share-kit.ps1` wrapper that resolves `MINIMODEL_WORKSPACE` and `TINYRUSTLM_LOCAL_SLM`, verifies the local artifact byte count and SHA-256, runs MiniModel `prepare-peer-share`, optionally writes peer-source announcement/feed metadata, `write-peer-companion-state` metadata, and `write-peer-contact-card` metadata when the user sets a consenting peer URL, writes metadata-only catalog snapshots, and prints the user's own `serve-peer-companion` or `serve-peer-pieces` command.
17. MiniModel may publish checksum-bound metadata with `source_huggingface_model_id`, `peer_offer_route`, `peer_offer_sha256`, `peer_source_count`, `peer_sources`, and same-origin `peer_source_announcement_routes` when a consenting peer source exists or an announcement feed is bound by SHA-256.
18. User opens the verified local `.slm` in TinyRustLM.

The generated conversion script and local share kit must not download model bytes, call a MiniModel proxy, or use a project-owned token. They are local convenience wrappers over Rust commands and must resolve or be edited to point at the user's local workspaces and local source or `.slm` files.

Until that chain exists for a model, the correct UI state is `Rust conversion required`, not compatible or runnable.

The local share metadata bundle, `.minimodel-peer-offer` proof, and `minimodel.peer_piece_set.v0` sidecar are not project-hosted transfer claims. The current implementation supports direct known-peer serve/fetch/import through Rust commands plus offline request, preflight, receipt, and receipt-chain inspection gates; broader discovery, relay, and NAT traversal remain later work.

## Lane 3: Future MiniModel P2P

Broad P2P discovery is a later phase. It should reuse the manifest and verifier instead of inventing a separate trust model.

The current implemented bridge is direct known-peer serve/fetch/import plus local peer-piece export and assembly. It proves that chunk files can be generated from a verified `.slm`, moved from a consenting direct peer endpoint, checked independently, reassembled, and passed back through the full verifier. A broader network transport can later move those same chunks, but it does not get to replace verification.

The July 3 desktop/P2P intake points to an optional MiniModel Peer Companion as the right place for advanced peer duties. That companion would be user-run local software, not MiniModel.com infrastructure. It can hide command complexity for power users while preserving the same Rust verifier, companion-readable share state, metadata-only peer companion inventory with duplicate contact-card peer URL rejection, local receipt, and no-server-byte boundary.

The detailed companion design is [peer-companion.md](peer-companion.md). It defines the future local-only boundary, source lanes, command contracts, local state, piece-store rules, consent gates, transport phases, UI requirements, tests, and completion gate.

The peer app may eventually support:

- local peer identity
- local piece stores
- peer discovery
- consent screens
- local quotas
- chunk selection
- resumable transfer
- NAT traversal
- relay fallback if legally reviewed
- local cache controls
- transfer receipts
- import receipts
- peer-piece sidecars
- TinyRustLM handoff after verified local import

The peer app must still ensure:

- transfer consent before bytes move
- execution/import consent before TinyRustLM opens the file
- whole-artifact byte count verification
- whole-artifact SHA256 verification
- chunk SHA256 verification
- Merkle-root verification
- `.slm` validation
- local import receipt
- local import receipt after peer-piece assembly before execution

MiniModel.com servers remain metadata-only even when P2P exists.

Tauri v2, Iced, Slint, egui, Dioxus, Iroh/QUIC, Rust-libp2p, WebRTC, WebTransport, BitTorrent-style chunking, Pear, Bare, and Hypercore remain evaluation lanes. None of them should become a dependency until the shared Rust verifier, consent gates, and local byte handling remain intact.

## UX Mapping

For new users, the product should use plain source labels:

- Your Local Files
- Hugging Face
- P2P Exchange

The first screen should favor the local path because it is the least surprising and most private.

Advanced details should be available without crowding the beginner path:

- manifest route
- catalog route
- source revision
- artifact SHA256
- chunk count
- Merkle root
- signature key id
- evidence sidecars
- import receipt

## Consent Gates

There are two distinct consent gates:

1. Transfer consent: the user chooses to obtain bytes from a peer or outside source.
2. Execution/import consent: the user chooses to open a verified local `.slm` in TinyRustLM.

The UI and manifest language must not collapse these gates into an automatic action.

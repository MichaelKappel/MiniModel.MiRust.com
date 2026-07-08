# Rust-First P2P Roadmap

MiniModel's first networking work should come after the manifest and verifier are stable.

The durable rule is that transport never replaces verification. A peer transfer must end with the same local artifact checks and import receipt as a local file.

## Phase 0: Documentation and Schema

Publish:

- `.slm` format documentation
- MiniModel manifest v0
- verifier MVP plan
- source-lane rules
- catalog boundary
- legal and takedown language
- example manifest
- example catalog entry
- example local share metadata bundle
- peer-source announcement, peer contact card, maintainer apply, announcement-feed, and batch snapshot publication command documentation

## Phase 1: Local Rust Verifier

Implement:

- line-oriented manifest parser
- required field checks
- boundary checks
- SHA256 artifact verification
- chunk metadata parser
- signature placeholder validation
- `.slm` validation integration
- local receipt writer
- drift tests

No networking is required in this phase.

## Phase 2: Metadata-Only Catalog Prototype

Publish static catalog entries that include:

- model id
- display name
- publisher id
- key id
- manifest metadata route
- model-card route
- license route
- source identity summary
- artifact byte count
- artifact SHA256
- quantization
- model shape
- tokenizer checksum
- tensor-layout checksum
- evidence status summary
- takedown/contact route
- peer hint status

Catalog entries must not include project-server artifact URLs.

Late peer availability now has three metadata-only publication paths. `add-peer-source` is the direct local path when the catalog entry and consenting peer URL are in the same workflow. `write-peer-source-announcement` plus `apply-peer-source-announcements` is the maintainer path when a converter sends portable availability metadata for drift-checked merge before the next snapshot. For many entries and announcements, `write-catalog-snapshot-with-announcements` performs the drift checks and writes final metadata-only `models.v0.json` in one command. For browser-visible late availability without rewriting catalog entries, `write-peer-source-announcement-feed` writes a metadata-only announcement feed and `write-catalog-snapshot-with-announcement-feed` binds the same-origin feed route into `models.v0.json` by SHA-256.

Catalog-declared peer-source announcement feeds are the first browser-visible publication convenience on top of that path. They are still metadata, must stay same-origin with the catalog, must be bound by SHA-256, must validate as `minimodel.peer_source_announcement_catalog` envelopes with no project-server byte claims, and must only help TinyRustLM discover consenting peer sources for Rust `import-peer-request` after peer-offer route/checksum/chunk-count/Merkle matching. Empty feeds are valid availability checks and keep proof-ready rows at "known peer needed" until real peer-source metadata is published. A peer contact card is even narrower: it is a local `minimodel.peer_contact_card` URL handoff for one reviewed direct peer, not catalog publication and not model-byte availability by itself.

## Phase 3: Local Share Metadata

Export `minimodel.local_slm_share_metadata.v0` after a verified local `.slm` import. The bundle should include:

- catalog-entry candidate
- local filename hint
- source identity and optional Hugging Face model id
- artifact byte count
- artifact SHA256
- fixed chunk size
- chunk count
- ordered chunk SHA256 list
- chunk-list SHA256
- Merkle root
- `peer_transfer_implemented=false`
- `network_transfer_available=false`

The Rust packer should also write `.minimodel-peer-offer` with `peer-offer <input.slm> <output.peer-offer>` and verify it with `validate-peer-offer`. That text manifest binds artifact SHA256, chunk SHA256 rows, chunk-list SHA256, and the Merkle root without embedding or serving model bytes.

The bundle and peer-offer are review and future-transfer inputs, not endorsements, model uploads, or live transfer claims.

## Phase 4: Local Peer Pieces

Define `fixed-size-merkle-v0`:

- fixed chunk size
- chunk count
- ordered chunk SHA256 list
- Merkle-root calculation
- optional chunk-list metadata route
- chunk-list metadata checksum

The verifier now validates local chunk sets and companion-readable share state before a broader network exists:

```text
minimodel export-peer-pieces <manifest> <artifact.slm> <output-dir>
minimodel assemble-peer-pieces <manifest> <piece-dir> <output.slm>
minimodel write-peer-companion-state <manifest> <piece-dir> <output-json> <known-peer-base-url>
minimodel write-peer-companion-inventory <output-json> <state-json> <manifest> <piece-dir> <receipt-ledger-json> <piece-store-quota-bytes> [contact-card-json...]
minimodel write-peer-contact-card <output-json> <known-peer-base-url> [peer-label]
minimodel serve-peer-companion <state-json> <manifest> <piece-dir> <bind-addr>
minimodel check-peer-status <manifest> <known-peer-base-url> <output-json>
minimodel inspect-peer-import-request <request-json> <manifest>
minimodel inspect-peer-import-preflight <output.preflight> <request-json> <manifest>
minimodel inspect-import-receipt <receipt.minimodel-receipt> <manifest> <artifact.slm>
minimodel inspect-peer-import-receipt <receipt.minimodel-receipt> <request-json> <preflight> <manifest> <artifact.slm>
```

`export-peer-pieces` writes `minimodel.peer_piece_set.v0` plus local piece files only after the source `.slm` passes verification. `assemble-peer-pieces` rejects piece drift, unsafe piece paths, chunk identity drift, and assembled artifact drift before writing the accepted `.slm`. `write-peer-companion-state` validates the prepared share and writes metadata-only state that a future local UI can display without touching model bytes. `write-peer-companion-inventory` binds that state to receipt-ledger, piece-store, serve-plan, and optional contact-card metadata, then rejects duplicate contact-card peer URLs before a UI can present one endpoint as multiple peers. `write-peer-contact-card` writes a smaller metadata-only reviewed known-peer URL handoff for TinyRustLM or a future companion to fill Known peer URL before Rust import. `serve-peer-companion` validates that state again before serving `minimodel.peer_status.v0.json`, the fixed companion-state route, and allow-listed piece routes, including under validated path-prefixed peer base URLs; `serve-peer-pieces` also serves the status route for piece-only peers. Receiver-side `inspect-peer-import-request`, `check-peer-status`, `preflight-peer-import-request`, and `inspect-peer-import-preflight` validate request, route, receiver-gate, status, piece-set, and advertised companion-state metadata before any piece transfer. Completed peer imports write transfer evidence into the receipt, including validated receiver-validation contract gates, piece-set SHA-256, companion-state status, peer-piece byte fetch, assembled-from-peer-pieces status, and no-project-server-byte flags; `inspect-import-receipt` and `inspect-peer-import-receipt` then bind that receipt back to the assembled artifact, request, and preflight evidence before browser import. This keeps networking from becoming the first place chunk logic, share-state logic, receiver-gate logic, or receipt semantics are tested.

## Phase 5: Transfer Experiments

Compare transfer options.

### Rust-native QUIC/blob transfer

Pros:

- Rust-first
- good fit for binary chunks
- explicit protocol design
- strong control over consent, quotas, and validation

Cons:

- discovery and NAT traversal need design
- ecosystem pieces may need to be assembled

### Iroh

Pros:

- Rust ecosystem
- content-addressed transfer concepts
- useful NAT traversal and blob-transfer direction

Cons:

- must be evaluated against MiniModel legal, browser, and deployment constraints
- dependency and protocol fit need careful review

### Rust-libp2p

Pros:

- broad P2P protocol toolkit
- mature identity and discovery concepts
- Rust implementation exists

Cons:

- can be complex for a first tiny-model exchange
- requires careful UX and resource controls

### BitTorrent-style chunking

Pros:

- proven swarm model
- maps well to chunk hashes
- good mental model for resumable transfer

Cons:

- MiniModel still needs its own manifest, license, evidence, and admission binding
- public swarm behavior needs legal review

### Pear, Bare, Hypercore

Pros:

- useful references for zero-infrastructure P2P applications
- strong ideas around append-only logs and peer distribution
- helpful design inspiration

Cons:

- JavaScript runtime dependency does not fit the Rust-first core by default
- MiniModel should not choose a JS runtime as a core dependency without explicit later justification

### Rust Hyper

Rust Hyper is ordinary HTTP infrastructure and should not be confused with Hypercore. It may be useful for docs or local HTTP plumbing, but it is not itself the P2P exchange strategy.

## Phase 6: Peer App

A future peer app should provide:

- local manifest import
- peer discovery
- consent screens
- chunk transfer
- resumable downloads
- local cache controls
- bandwidth and storage limits
- receipt writing
- TinyRustLM handoff instructions

It must not:

- auto-open downloaded models
- bypass `.slm` validation
- rely on MiniModel.com as a byte relay
- hide publisher identity or license routes
- collapse transfer consent into execution consent

The durable design target is [peer-companion.md](peer-companion.md). Treat that file as the acceptance checklist before claiming a first companion prototype.

## Phase 7: Public Exchange Review

Before public exchange:

- legal review
- abuse reporting workflow
- metadata moderation plan
- signed publisher identity plan
- transparency-log research
- takedown process
- privacy review
- dependency review
- threat model

Public peer transfer should ship only after the local verifier and catalog boundaries have already proven stable.

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

The bundle is a review and future-transfer input, not an endorsement, model upload, or live transfer claim.

## Phase 4: Chunk and Merkle Proofs

Define `fixed-size-merkle-v0`:

- fixed chunk size
- chunk count
- ordered chunk SHA256 list
- Merkle-root calculation
- optional chunk-list metadata route
- chunk-list metadata checksum

The verifier should be able to validate local chunk sets before a network exists. This keeps networking from becoming the first place chunk logic is tested.

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

# Legal, Consent, and Liability Boundary

MiniModel.com should act as a metadata directory, verification aid, and information-location tool. It should not act as a model host, inference provider, model approval authority, or legal reviewer.

This document is product and engineering guidance, not legal advice.

## Required Public Posture

Catalog and documentation language should say:

- Listings are user or publisher assertions.
- MiniModel does not claim listed models are safe.
- MiniModel does not claim listed models are lawful.
- MiniModel does not claim listed models are cleanly trained.
- MiniModel does not claim listed models are fit for any purpose.
- License and model-card fields are metadata, not legal advice.
- Users are responsible for reviewing licenses, usage terms, and applicable law.
- Disputed metadata can be reported through a takedown/contact route.

## Server Allow List

Project servers may serve:

- docs
- schema files
- example manifests
- metadata-only catalog entries
- signed catalog metadata
- public keys
- contact routes
- takedown routes
- model cards and license text when those are metadata only

## Server Deny List

Project servers must not serve:

- user model bytes
- third-party `.slm` artifacts
- safetensors checkpoints
- GGUF files
- ONNX files
- adapter package bytes
- tokenizer binaries when they are part of user model artifacts
- server-side inference for user models
- proxy routes for external model-byte downloads
- automatic browser-fetch instructions for model artifacts

## Takedown and Contact Route

MiniModel should publish a stable contact route before public submissions open.

The route should accept reports for:

- disputed metadata
- illegal-content references
- malware claims
- deceptive model-card or license links
- spam catalog entries
- impersonation or key misuse
- unwanted personal data in metadata

The first moderation action should target metadata removal or hiding, because project servers do not host model bytes.

## User Consent

Two consent moments are required.

Transfer consent:

- User chooses to obtain bytes from a peer or external source.
- User sees that MiniModel does not host or endorse those bytes.
- User sees expected byte count and checksum when available.

Execution/import consent:

- User chooses a local `.slm` file in TinyRustLM.
- Rust validates before use.
- User sees local verification or receipt state when available.

## Hugging Face Boundary

Hugging Face may provide metadata and user-side acquisition context. MiniModel must not turn Hugging Face into a hidden backend.

Forbidden:

- project-owned tokens for user downloads
- hidden `/resolve/` proxying
- project caching of source checkpoints
- representing remote inference products as local MiniModel execution

Allowed:

- linking to model cards
- recording source revisions
- recording source config/tokenizer checksums
- warning that external accounts, tokens, licenses, or terms may apply

## P2P Boundary

P2P does not remove liability concerns. It changes the transport only.

Before public peer transfer:

- legal review is required
- abuse reporting route is required
- metadata moderation policy is required
- user consent UI is required
- local storage controls are required
- transfer logs should avoid storing private file contents or unnecessary personal data

Project servers should still not serve model bytes.

## No Endorsement

MiniModel can verify that bytes match a manifest. That does not mean:

- the model is safe
- the model is lawful
- the model is unbiased
- the license is valid
- the publisher owns the rights
- training data was properly obtained
- output is correct
- the model is suitable for a task

Verification is about identity and integrity, not endorsement.

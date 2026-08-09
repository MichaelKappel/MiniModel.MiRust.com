# MiniModel.MiRust.com

Developer documentation site for MiniModel.com.

The source-controlled site release is `1.0.0`, dated and last published
`2026-08-09`. Human-readable history lives at `/updates/`; canonical current
and append-only history records live under `/.well-known/`.

This site documents:

- the `.slm` binary model format used by TinyRustLM
- the MiniModel metadata-only catalog boundary
- the MiniModel manifest v0 draft
- the local Rust verifier MVP
- companion-readable peer-share state, peer companion inventories with duplicate contact-endpoint rejection, validated state serving, receiver-validation gates, and peer-transfer receipt-chain evidence for a future local Peer Companion
- protected TinyRustLM NuGet SDK local share-kit verification with `.slm` assembly plus receipt sidecar writing, receipt inspection, and UAIX memory/persona harness APIs for .NET ecosystem apps
- NuGet publication status: the protected source-level `TinyRustLM.Abstractions`, `TinyRustLM.Core`, `TinyRustLM.P2P`, and `TinyRustLM.Memory` lane is verified locally at source version `0.1.8`; public NuGet.org availability is currently carried by the branded `UAIX.Browser.Core.Abstractions`, `UAIX.Browser.p2pLLM.Runtime`, `UAIX.Browser.p2pRuntime.P2P`, `UAIX.Browser.Memory`, and `UAIX.Browser.p2pLLM.Conversion` packages, all published and post-publish verified at version `0.1.8`
- NuGet symbol status: matching `.snupkg` symbol package files are audited beside the protected SDK packages, publish plans record `symbol_publish_mode=explicit_snupkg_push_after_primary_package`, and the SHA256SUMS manifest is symbol-hash-bound; Browser readiness audits write `uaix-browser-nuget-release-readiness-publish-plan-dry-run.json` by default so retained `uaix-browser-nuget-publish-plan.json` post-push evidence is not overwritten
- metadata-only peer contact cards for reviewed known-peer URL handoffs
- the q8 fixture peer-import request example with metadata routes and receiver-validation contract fields
- TinyRustLM local share metadata export after verified `.slm` import
- local files, Hugging Face discovery/conversion-script plus peer-offer handoff, and future P2P source lanes
- legal, consent, and liability boundaries

MiniModel.com project servers do not run user model bytes and do not serve user model bytes.

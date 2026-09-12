# MiniModel Source And Byte Lanes

## Catalog Lane

MiniModel.org publishes bounded metadata: immutable source identity, license
and provenance, exact composition identity, qualification references, runtime
requirements, piece-set identity, and expiring peer announcements. It carries
no model bytes or prompts.

## Initial Server Seed

MiniModel.org is authorized to serve initial verified SLM2 compositions from
the operator's designated model store. This is an exact seed peer, with the
same member and piece verification as other peers. The catalog itself remains
metadata. Seed authorization does not prove a working model or a live transfer.

TinyRustLM restores a usable cached model or automatically acquires a small
qualified starter from this seed. Local files, Hugging Face, conversion and
manual peer/IP settings remain in Advanced.

## Exact Peer Lane

One consenting sender offers one exact qualified composition. A receiver binds
the same composition and piece-set identity before mixing pieces, validates
every range and digest, bounds concurrency, preserves durable progress, and
verifies every completed member before atomic installation.

## Local Conversion Lane

When no exact qualified peer route is selected, the user may explicitly
authorize an installed companion to acquire one immutable public source
revision. The companion verifies source locks and license metadata, performs
one registered conversion, invokes independent inspection, and admits only an
exact composition with the required qualification references.

## Browser Activation Lane

TinyRustLM.com opens only an installed, independently accepted composition.
Browser execution, conversation quality, cancellation, privacy, and clean
profile behavior require their own evidence.

## Forbidden Lane Mixing

The system does not proxy arbitrary model downloads, silently switch
peers, mix different piece-set identities, translate obsolete artifacts,
download instruction files as acquisition, or use remote inference as a
fallback.

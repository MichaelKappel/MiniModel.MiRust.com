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
- save an optional `.tinyrustlm-convert.ps1` local script that runs Rust packer commands against user-owned local source files
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
3. The user may also save a `.tinyrustlm-convert.ps1` script. It runs `inspect-safetensors`, `plan-safetensors-source`, `convert-safetensors-trained`, `validate`, and `validate-manifest` locally.
4. A user or converter acquires source bytes outside project infrastructure if they choose.
5. Conversion writes a local `.slm`, then Rust validates byte count, checksum, shape, tokenizer, runtime smoke, and admission evidence.
6. TinyRustLM may export `minimodel.local_slm_share_metadata.v0` with the verified artifact SHA256, chunk hashes, chunk-list SHA256, and a Merkle root.
7. MiniModel may publish checksum-bound metadata with `source_huggingface_model_id` and future peer hints.
8. User opens the verified local `.slm` in TinyRustLM.

The generated conversion script must not download model bytes, call a MiniModel proxy, or use a project-owned token. It is a local convenience wrapper over Rust commands and must be edited to point at the user's local TinyRustLM workspace and local `.safetensors` file.

Until that chain exists for a model, the correct UI state is `conversion required`, not compatible or runnable.

The local share metadata bundle is not a live transfer claim. It must say peer transfer is not implemented until a consenting peer app can move chunks and Rust can reverify them before import.

## Lane 3: Future MiniModel P2P

P2P is a later phase. It should reuse the manifest and verifier instead of inventing a separate trust model.

The peer app may eventually support:

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

The peer app must still ensure:

- transfer consent before bytes move
- execution/import consent before TinyRustLM opens the file
- whole-artifact byte count verification
- whole-artifact SHA256 verification
- chunk SHA256 verification
- Merkle-root verification
- `.slm` validation
- local import receipt

MiniModel.com servers remain metadata-only even when P2P exists.

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

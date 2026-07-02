# `.slm` Format Reference

`.slm` is the local model file format used by TinyRustLM. It is designed for simple browser loading, strict Rust-side validation, and predictable checksum-bearing evidence.

## Design Constraints

The format is:

- little-endian
- self-describing enough for TinyRustLM
- versioned
- non-JSON
- static
- checksum-bearing
- browser-friendly
- validated by Rust before use

The format is not:

- GGUF
- ONNX
- safetensors
- a dynamic schema language
- a server fetch contract
- a license or provenance certificate by itself

Source formats such as safetensors may be reviewed and converted locally. TinyRustLM executes `.slm`.

## File Layout

The v1 file layout is:

1. Header.
2. Tokenizer section.
3. Padding to 64-byte alignment as needed.
4. Tensor directory.
5. Padding to 64-byte alignment as needed.
6. Tensor payloads and quantization scale payloads.

Tensor directory and tensor data offsets are 64-byte aligned. Tensor payload offsets are also 64-byte aligned.

## Header

The v1 header is 108 bytes minimum.

| Offset | Type | Field | Requirement |
| --- | --- | --- | --- |
| 0 | bytes[4] | `magic` | Must be `SLM1`. |
| 4 | u32 | `version` | Must be `1`. |
| 8 | u32 | `header_length` | Must be at least `108` and fit inside the file. |
| 12 | u32 | `model_type` | Current supported value is `1`. |
| 16 | u32 | `flags` | Bit 0 means tied output projection. |
| 20 | u32 | `vocab_size` | Must be at least 260 for current tokenizers. |
| 24 | u32 | `special_token_count` | Current byte-tokenizer route requires at least 4. |
| 28 | u32 | `hidden_size` | Nonzero. |
| 32 | u32 | `layer_count` | Nonzero. |
| 36 | u32 | `head_count` | Nonzero. |
| 40 | u32 | `kv_head_count` | Nonzero, no greater than head count, divides head count. |
| 44 | u32 | `head_dim` | Nonzero. |
| 48 | u32 | `ffn_size` | Nonzero. |
| 52 | u32 | `max_context` | Nonzero. |
| 56 | f32 | `rope_theta` | Finite and positive. |
| 60 | f32 | `rms_norm_epsilon` | Finite and positive. |
| 64 | u64 | `tokenizer_offset` | Must not overlap the header. |
| 72 | u64 | `tokenizer_length` | Must keep tokenizer range inside the file. |
| 80 | u64 | `tensor_directory_offset` | 64-byte aligned. |
| 88 | u32 | `tensor_count` | Number of directory entries. |
| 92 | u64 | `tensor_data_offset` | 64-byte aligned and after the tensor directory. |
| 100 | u64 | `checksum` | Nonzero custom u64 checksum. |

The runtime validates that `hidden_size == head_count * head_dim`.

## File Checksum

The v1 checksum is a custom u64 checksum over the full file. During recomputation, bytes 100..108, the checksum field itself, are treated as zero.

The checksum seed is `0x9e3779b97f4a7c15`. For each byte, the implementation folds the byte plus an index-derived value, rotates left by 7, and multiplies by `0x100000001b3`.

This checksum is not a cryptographic signature. MiniModel manifests add SHA256 for artifact identity, while `.slm` carries the runtime-local structural checksum.

## Tensor Directory Entry

Each tensor directory entry is 64 bytes.

| Offset inside entry | Type | Field | Requirement |
| --- | --- | --- | --- |
| 0 | u64 | `name_hash` | FNV-1a u64 over the stable tensor name. |
| 8 | u32 | `dtype` | `1=f32`, `2=q8_0`, `3=q4_0`. |
| 12 | u32 | `rank` | 1 through 4. |
| 16 | u32 | `dim0` | Nonzero if inside rank. |
| 20 | u32 | `dim1` | Nonzero if inside rank. |
| 24 | u32 | `dim2` | Nonzero if inside rank. |
| 28 | u32 | `dim3` | Nonzero if inside rank. |
| 32 | u64 | `byte_offset` | 64-byte aligned file offset for payload. |
| 40 | u64 | `byte_length` | Exact payload byte count. |
| 48 | u64 | `scale_offset` | Quantization scale payload offset or zero for f32. |
| 56 | u32 | `block_size` | Quantization block size or zero for f32. |

The validator rejects duplicate tensor name hashes.

## Tensor Name Hash

Tensor names are not stored as strings in the directory. They are represented by a stable FNV-1a u64 hash.

Required tensor names are:

- `tok_embeddings.weight`
- `norm.weight`
- `output.weight` unless tied output is enabled
- for each layer:
  - `layers.N.attention_norm.weight`
  - `layers.N.ffn_norm.weight`
  - `layers.N.wq.weight`
  - `layers.N.wk.weight`
  - `layers.N.wv.weight`
  - `layers.N.wo.weight`
  - `layers.N.w1.weight`
  - `layers.N.w2.weight`
  - `layers.N.w3.weight`

## Required Tensor Shapes

Top-level shapes:

- `tok_embeddings.weight`: `[vocab_size, hidden_size]`
- `norm.weight`: `[hidden_size]`
- `output.weight`: `[vocab_size, hidden_size]` when not tied

Layer shapes:

- attention norm and FFN norm: `[hidden_size]`
- `wq`, `wk`, `wv`, `wo`: `[hidden_size, hidden_size]`
- `w1`, `w3`: `[ffn_size, hidden_size]`
- `w2`: `[hidden_size, ffn_size]`

When `flags & 1 != 0`, the output projection is tied to `tok_embeddings.weight` and `output.weight` may be omitted.

## Dtypes

Current dtype ids:

- `1`: f32 payload
- `2`: q8_0 payload
- `3`: q4_0 payload

The validator labels a file as `f32`, `q8_0`, `q4_0`, or `mixed` based on tensor entries.

## f32 Payloads

For f32 tensors:

- `byte_length = element_count * 4`
- `scale_offset = 0`
- `block_size = 0`
- every f32 value must be finite

The trained-source validator additionally rejects absolute values above the current source-side safety bound and rejects all-zero placeholder payloads during source conversion.

## q8_0 Payloads

For q8_0 tensors:

- payload bytes store one signed 8-bit weight per element
- `byte_length = element_count`
- `scale_offset` must be nonzero
- `block_size` must equal columns per row
- one f32 scale is stored per row
- all scale values must be finite and positive

Rows are determined by the first dimension for rank greater than 1. Rank-1 tensors are treated as one row.

## q4_0 Payloads

For q4_0 tensors:

- payload bytes store two 4-bit weights per byte
- `byte_length = element_count / 2`
- element count must be even
- `scale_offset` must be nonzero
- `block_size` must be nonzero, even, and divide columns per row
- one f32 scale is stored per row block
- all scale values must be finite and positive

## Tokenizer Sections

The tokenizer section is referenced by `tokenizer_offset` and `tokenizer_length`.

Supported section magics:

- `BTOK`
- `BPE1`

### `BTOK`

The `BTOK` byte tokenizer section contains:

- magic `BTOK`
- version `1`
- fixed vocab size `260`
- special token ids `256`, `257`, `258`, `259`

This section is the simplest tokenizer route and is useful for tiny fixtures and deterministic testing.

### `BPE1`

The `BPE1` tokenizer section contains:

- magic `BPE1`
- version `1`
- vocab size matching the header
- four special token ids inside vocabulary
- token count
- merge count
- token records
- merge records

Token records store:

- `token_id`
- byte length
- raw token bytes

Merge records store:

- `left`
- `right`
- `output`
- `rank`

The validator rejects vocab drift, duplicate token ids, empty BPE token bytes, merge outputs missing from the token table, merge ids outside vocabulary, and trailing bytes.

## Tokenizer Checksum

The tokenizer checksum is a u64 section checksum over the tokenizer section bytes with seed `0x746f6b656e697a65`.

MiniModel manifests use this checksum to bind a manifest to the tokenizer identity reported by TinyRustLM validation.

## Tensor Layout Checksum

The tensor layout checksum is a u64 over sorted tensor entries. It includes:

- tensor name hash
- dtype
- rank
- dimensions
- block size
- byte length

MiniModel uses this checksum to detect shape, dtype, and quantization drift even when the full artifact checksum is also present.

## Adapter Packages

TinyRustLM also validates adapter sidecar package families:

- `ADP1`: raw f32 task-delta package
- `ASP1`: sparse f32 task-delta package
- `ALR1`: low-rank f32 task-delta package

Adapters are not a substitute for `.slm` validation. They are applied only to a loaded compatible base model after identity checks match:

- base flags
- parameter count
- tensor layout checksum
- tokenizer checksum
- tensor directory identity
- adapter payload checksums

The browser may display adapter choices after receipt and manifest checks, but Rust validates adapter package bytes before mutation.

## Source Conversion Chain

Trained source conversion is outside the browser runtime.

The current packer flow supports:

- `source-template`
- `review-safetensors-candidate`
- `extract-safetensors-source`
- `validate-source`
- `convert-trained`
- `convert-safetensors-trained`
- `peer-offer`
- `validate-peer-offer`
- `runtime-smoke`
- `eval-template`
- native eval runner
- `admission-record`
- selector registry generation

The source manifest is line-oriented. It declares shape, tokenizer route, source kind, tensor rows, checksums, tied-output status, and BPE records when applicable. Source tensor paths must stay under `tensors/`; absolute paths and parent traversal are rejected.

## Admission Chain

A `.slm` file can be structurally valid without being quality-admitted.

The evidence chain separates:

- structure validation
- provenance manifest
- runtime smoke
- eval evidence
- admission record
- promotion ledger
- selector registry

Deterministic smoke models must not claim trained assistant quality. Converted trained models validate first as structure-accepted and quality-pending until evidence passes.

## Failure Cases

The validator rejects:

- invalid magic
- short files
- unsupported versions
- unsupported model type
- zero checksum
- checksum mismatch
- zero dimensions
- attention shape mismatch
- invalid KV-head divisibility
- invalid RoPE theta or RMSNorm epsilon
- out-of-range offsets
- unaligned tensor directory or tensor data offsets
- malformed tokenizer sections
- unsupported tokenizer magic
- malformed tensor entries
- unsupported dtype
- payload length mismatch
- non-finite f32 payload values
- missing quantization scale payloads
- non-positive quantization scales
- invalid q4 block sizes
- duplicate tensor hashes
- missing required tensors
- required tensor shape mismatch
- omitted `output.weight` without tied-output flag

## MiniModel Implication

The MiniModel verifier must not treat manifest metadata as enough. It must call or reproduce the same `.slm` validation rules before writing an import receipt.

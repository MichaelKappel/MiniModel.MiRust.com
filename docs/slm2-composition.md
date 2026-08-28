# SLM2 Composition Identity

A current TinyRustLM composition is exactly six semantic members:

- `model.slm2`
- `tokenizer.tokenizer2`
- `template.template2`
- `sampling.sampling2`
- `prompt.prompt2`
- `composition.acg2`

The composition manifest binds each exact logical name, byte count,
cryptographic digest, schema identity, semantic role, source revision and
locks, conversion profile, quantization profile, and dependency compatibility.
Paths and display aliases are not identity.

MiniModel catalog and peer records refer to one exact independently qualified
composition identity. They reject missing, duplicate, extra, substituted, or
mixed members. A matching piece or member hash does not prove qualification.

Old `.slm`, manifest-v0, alias, repair, translation, compatibility, migration,
and fallback paths are not current.

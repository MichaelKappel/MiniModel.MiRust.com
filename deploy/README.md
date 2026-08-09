# MiniModel Documentation Publication

The release manifest binds one immutable content commit to canonical Git blob
bytes. The generator reconstructs those bytes into ignored staging instead of
trusting platform-dependent worktree line endings.

Validation only:

```powershell
node tools/build-site-deployment-manifest.js <content-commit>
.\tools\deploy-site.ps1
```

Authorized publication:

```powershell
.\tools\deploy-site.ps1 -Publish
```

Publishing requires a clean pushed checkout and the exact external FileZilla
profile named by the manifest. The publisher uses FTPS, bounded verified
chunks, per-file staging and rollback, authenticated byte verification, exact
public HTTPS readback, route smoke checks, and append-only receipts. Credentials
are read only from the external profile and never enter source, staging, or
receipts. `/.well-known/site-release.json` is deliberately published last as
the public release marker.

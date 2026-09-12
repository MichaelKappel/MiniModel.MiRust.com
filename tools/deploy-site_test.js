"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const root = path.resolve(__dirname, "..");

test("PowerShell sends identity-bound canonical streams without a copied stage", () => {
  // Execute selected canonical function ASTs. Remote transport exists only in process memory.
  const script = String.raw`
$ErrorActionPreference = 'Stop'
$repositoryRoot = (Get-Location).Path
$tokens = $null
$parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Join-Path $repositoryRoot 'tools\deploy-site.ps1'), [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'Publisher syntax is invalid' }
$names = @('Assert-RelativePath','Get-CanonicalPublicPath','Get-LocalPrefixSha256','Send-RemoteFile','Get-FileSha256')
foreach ($name in $names) {
    $definitions = @($ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -ceq $name }, $true))
    if ($definitions.Count -ne 1) { throw 'Ambiguous canonical function' }
    . ([scriptblock]::Create($definitions[0].Extent.Text))
}
$script:checks = 0
function Assert($condition) { if (-not $condition) { throw 'Custody assertion failed' }; $script:checks++ }
function Reject($action) { $rejected = $false; try { & $action } catch { $rejected = $true }; Assert $rejected }
function Hash([byte[]]$bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Start-Sleep { param($Milliseconds) }
function Get-RemoteSize { param($RemotePath) $script:remoteCalls++; if ($null -eq $script:remote) { return [int64]-1 }; return [int64]$script:remote.Length }
function Get-RemoteSha256 { param($RemotePath) return (Hash $script:remote) }
function Remove-RemoteFileIfPresent { param($RemotePath) $script:remote = $null; $script:removals++ }
function Write-RemoteChunk {
    param($RemotePath, [byte[]]$Bytes, [bool]$Append)
    $script:writes++
    if ($Append) { $script:remote = [byte[]]($script:remote + $Bytes) } else { $script:remote = [byte[]]$Bytes.Clone() }
}
$local = Get-CanonicalPublicPath -RelativePath 'LICENSE.txt'
$expected = [IO.File]::ReadAllBytes($local)
$identity = Hash $expected
Assert ($local -ceq (Join-Path $repositoryRoot 'LICENSE.txt'))
Assert ((Get-FileSha256 -Path $local) -ceq $identity)
foreach ($invalid in @('../README.md','./README.md','docs/../README.md','/README.md','C:/outside','docs//x')) {
    Reject { Get-CanonicalPublicPath -RelativePath $invalid }
}
foreach ($scenario in @('new','resume','bad-prefix','oversize','empty','complete')) {
    $script:writes = 0; $script:removals = 0; $script:remoteCalls = 0
    $script:remote = switch ($scenario) {
        'new' { $null }
        'resume' { ,([byte[]]$expected[0..8191]) }
        'bad-prefix' { ,([byte[]]@(1,2,3)) }
        'oversize' { ,(New-Object byte[] ($expected.Length + 1)) }
        'empty' { ,(New-Object byte[] 0) }
        'complete' { ,([byte[]]$expected.Clone()) }
    }
    Send-RemoteFile -LocalPath $local -RemotePath 'LICENSE.deploy-test.txt' -ExpectedBytes $expected.Length -ExpectedSha256 $identity
    Assert ((Hash $script:remote) -ceq $identity)
    Assert ($script:remote.Length -eq $expected.Length)
    if ($scenario -eq 'complete') { Assert ($script:writes -eq 0) }
    if ($scenario -eq 'resume') { Assert ($script:writes -eq 1) }
    if ($scenario -in @('bad-prefix','oversize','empty')) { Assert ($script:removals -eq 1) }
}
$script:remoteCalls = 0
Reject { Send-RemoteFile -LocalPath $local -RemotePath 'must-not-write' -ExpectedBytes $expected.Length -ExpectedSha256 ('0' * 64) }
Reject { Send-RemoteFile -LocalPath $local -RemotePath 'must-not-write' -ExpectedBytes ($expected.Length + 1) -ExpectedSha256 $identity }
Assert ($script:remoteCalls -eq 0)
Reject { Get-LocalPrefixSha256 -Path $local -Bytes ($expected.Length + 1) }
# A server that reports an impossible offset fails without replaying different bytes.
function Write-RemoteChunk { param($RemotePath, [byte[]]$Bytes, [bool]$Append) $script:remote = [byte[]]@(9) }
$script:remote = $null
Reject { Send-RemoteFile -LocalPath $local -RemotePath 'offset-drift' -ExpectedBytes $expected.Length -ExpectedSha256 $identity }
Write-Output ('CUSTODY-CHECKS ' + $script:checks)
`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], { cwd: root, encoding: "utf8", windowsHide: true, timeout: 30000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /CUSTODY-CHECKS 30/);
});

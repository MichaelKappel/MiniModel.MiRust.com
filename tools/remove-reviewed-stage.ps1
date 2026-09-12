[CmdletBinding(SupportsShouldProcess = $true)]
param()

$ErrorActionPreference = 'Stop'
$root = 'E:\Source\Rust\MiniModel.MiRust.com'
$target = Join-Path $root 'deploy\staging\1.1.0'
$recordRoot = Join-Path $root 'artifacts\ecosystem-cleanup-20260912'
$inventoryPath = Join-Path $recordRoot 'stage-retirement.json'
$receiptPath = Join-Path $recordRoot 'stage-retirement-receipt.json'
$inventoryHash = 'f8cddffc1516e1ec88558b62442f1ae8b95a675ed537f8a0b30ab40ee32f9d22'

# This retirement admits one exact historical stage, never a caller-supplied path.
if ([IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)) -cne $root -or
    [IO.Path]::GetFullPath($target) -cne 'E:\Source\Rust\MiniModel.MiRust.com\deploy\staging\1.1.0' -or
    -not $target.StartsWith($root + '\', [StringComparison]::Ordinal)) { throw 'Noncanonical retirement path.' }
foreach ($start in @($root, $recordRoot)) {
    $cursor = $start
    while ($cursor) {
        $item = Get-Item -LiteralPath $cursor -Force
        if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unsafe record ancestry.' }
        $cursor = Split-Path -Parent $cursor
    }
}
if ((Get-Item -LiteralPath $inventoryPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked inventory.' }
if ((Get-FileHash -LiteralPath $inventoryPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $inventoryHash) { throw 'Inventory changed.' }
$inventory = Get-Content -LiteralPath $inventoryPath -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $target)) { Write-Output 'Reviewed stage already absent.'; return }
if (Test-Path -LiteralPath $receiptPath) { throw 'Retirement receipt already exists but stage is still present.' }
$cursor = $target
while ($cursor) {
    $item = Get-Item -LiteralPath $cursor -Force
    if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unsafe target ancestry.' }
    $cursor = Split-Path -Parent $cursor
}
$members = @(Get-ChildItem -LiteralPath $target -Force -Recurse)
if (@($members | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Linked stage member.' }
$files = @($members | Where-Object { -not $_.PSIsContainer })
if ($files.Count -ne 27) { throw 'Stage file count changed.' }
foreach ($file in $files) {
    $relative = $file.FullName.Substring($target.Length + 1).Replace('\', '/')
    $expected = @($inventory.files | Where-Object { $_.path -ceq $relative })
    if ($expected.Count -ne 1 -or $file.Length -ne $expected[0].bytes -or
        (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -cne $expected[0].sha256) {
        throw 'Stage bytes changed; review is required.'
    }
}
if ($PSCmdlet.ShouldProcess($target, 'Delete 27 reviewed historical copies (87,424 logical bytes)')) {
    $before = [IO.DriveInfo]::new('E:\').AvailableFreeSpace
    Remove-Item -LiteralPath $target -Recurse -Force
    if (Test-Path -LiteralPath $target) { throw 'Stage retirement incomplete.' }
    $after = [IO.DriveInfo]::new('E:\').AvailableFreeSpace
    $receipt = [ordered]@{ schema='minimodel-mirust.stage-retirement-receipt.v1'; completed_utc=(Get-Date).ToUniversalTime().ToString('o'); target=$target;
        inventory_sha256=$inventoryHash; deleted_files=27; logical_bytes=87424; target_absent=$true;
        volume_available_before=$before; volume_available_after=$after; volume_delta_bytes=($after-$before);
        measurement_limit='Volume free space can also change because of concurrent activity.' }
    [IO.File]::WriteAllText($receiptPath, (($receipt | ConvertTo-Json -Depth 4) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    Write-Output 'Reviewed stage removed; receipt recorded.'
}

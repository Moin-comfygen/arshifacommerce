$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $projectRoot "dist"
$distPrefix = [System.IO.Path]::GetFullPath($dist) + [System.IO.Path]::DirectorySeparatorChar
$archivePath = Join-Path $projectRoot "Product360-Research-0.1.0.zip"
$manifestPath = Join-Path $dist "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Build the extension before packaging it. Missing dist\manifest.json."
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$requiredFiles = @($manifest.action.default_popup, $manifest.background.service_worker)
$requiredFiles += @($manifest.icons.PSObject.Properties | ForEach-Object { $_.Value })
$requiredFiles += @($manifest.action.default_icon.PSObject.Properties | ForEach-Object { $_.Value })
$requiredFiles += @($manifest.content_scripts | ForEach-Object { $_.js })
$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $dist $_)) })
if ($manifest.manifest_version -ne 3 -or $missing.Count -gt 0) {
  throw "Manifest validation failed. Missing files: $($missing -join ', ')"
}

Add-Type -AssemblyName System.IO.Compression
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $dist -File -Recurse | ForEach-Object {
    $entryName = $_.FullName.Substring($distPrefix.Length).Replace("\", "/")
    $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $source = [System.IO.File]::OpenRead($_.FullName)
    $destination = $entry.Open()
    try {
      $source.CopyTo($destination)
    } finally {
      $destination.Dispose()
      $source.Dispose()
    }
  }
} finally {
  $archive.Dispose()
  $stream.Dispose()
}

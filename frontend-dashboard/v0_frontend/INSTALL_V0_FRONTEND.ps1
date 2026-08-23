# Run this script from:
# D:\BRICS-Hackathon-2026\frontend-dashboard
#
# It backs up the current UI and installs the v0-style Phase 1 frontend.

$root = Get-Location
$source = "D:\BRICS_v0_full_frontend"

if (-not (Test-Path "$root\package.json")) {
    Write-Host "ERROR: Run this from frontend-dashboard." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$source\App.jsx")) {
    Write-Host "ERROR: Frontend package was not found at $source" -ForegroundColor Red
    exit 1
}

$backup = ".\src\backup-before-v0"
New-Item -ItemType Directory -Force $backup | Out-Null

Copy-Item ".\src\App.jsx" "$backup\App.jsx" -Force
if (Test-Path ".\src\App.css") { Copy-Item ".\src\App.css" "$backup\App.css" -Force }
if (Test-Path ".\src\index.css") { Copy-Item ".\src\index.css" "$backup\index.css" -Force }

Copy-Item "$source\App.jsx" ".\src\App.jsx" -Force
Copy-Item "$source\App.css" ".\src\App.css" -Force
Copy-Item "$source\index.css" ".\src\index.css" -Force

Write-Host ""
Write-Host "SUCCESS: v0-style frontend installed." -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:"
Write-Host "  npm run build"
Write-Host "  npm run dev"

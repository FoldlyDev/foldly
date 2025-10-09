# Script to clean OLD Claude Code project history while preserving current project
# This will reduce the config file size from 13MB to a few KB

$configPath = "$env:USERPROFILE\.claude.json"
$backupPath = "$env:USERPROFILE\.claude.json.backup"

# Get current project path and normalize it (handle both forward/back slashes and case)
$currentProject = (Get-Location).Path
# Normalize to forward slashes for comparison (matches how Claude stores paths)
$currentProjectNormalized = $currentProject.Replace('\', '/')
Write-Host "Current project: $currentProjectNormalized" -ForegroundColor Cyan

Write-Host "=== Claude Code Config Cleaner ===" -ForegroundColor Cyan
Write-Host ""

# Create backup
Write-Host "[1/5] Creating backup..." -ForegroundColor Yellow
Copy-Item $configPath $backupPath -Force
Write-Host "      Backup saved to: $backupPath" -ForegroundColor Gray

# Read and parse JSON
Write-Host "[2/5] Reading config file..." -ForegroundColor Yellow
$json = Get-Content $configPath -Raw | ConvertFrom-Json

# Get original size
$originalSize = (Get-Item $configPath).Length / 1MB
Write-Host "      Original size: $([math]::Round($originalSize, 2)) MB" -ForegroundColor Gray

# Analyze projects
Write-Host "[3/5] Analyzing projects..." -ForegroundColor Yellow
if ($json.projects) {
    $projectList = $json.projects | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    $totalProjects = $projectList.Count

    Write-Host "      Found $totalProjects projects:" -ForegroundColor Gray

    $toKeep = @()
    $toClear = @()

    foreach ($projectName in $projectList) {
        $historyCount = 0
        if ($json.projects.$projectName.history) {
            $historyCount = $json.projects.$projectName.history.Count
        }

        # Normalize project name for comparison (case-insensitive, handle slashes)
        $projectNameNormalized = $projectName.Replace('\', '/')

        if ($projectNameNormalized -eq $currentProjectNormalized) {
            Write-Host "      [+] KEEP: $projectName ($historyCount history entries)" -ForegroundColor Green
            $toKeep += $projectName
        } else {
            Write-Host "      [X] CLEAR: $projectName ($historyCount history entries)" -ForegroundColor Red
            $toClear += $projectName
        }
    }

    # Ask for confirmation
    Write-Host ""
    Write-Host "[4/5] Ready to clean $($toClear.Count) old project(s)" -ForegroundColor Yellow
    Write-Host "      Current project history will be PRESERVED" -ForegroundColor Green
    Write-Host ""
    $confirmation = Read-Host "      Continue? (yes/no)"

    if ($confirmation -ne "yes") {
        Write-Host ""
        Write-Host "Cancelled. No changes made." -ForegroundColor Yellow
        exit
    }

    # Clear old project histories
    Write-Host ""
    Write-Host "[5/5] Cleaning old projects..." -ForegroundColor Yellow

    foreach ($projectName in $toClear) {
        if ($json.projects.$projectName.history) {
            $count = $json.projects.$projectName.history.Count
            $json.projects.$projectName.history = @()
            Write-Host "      Cleared $count entries from: $projectName" -ForegroundColor Gray
        }
    }

    # Save cleaned config
    Write-Host "      Saving cleaned config..." -ForegroundColor Gray
    $json | ConvertTo-Json -Depth 100 | Set-Content $configPath -Encoding UTF8

    # Get new size
    $newSize = (Get-Item $configPath).Length / 1KB
    $saved = $originalSize * 1024 - $newSize

    Write-Host ""
    Write-Host "=== Cleaning Complete ===" -ForegroundColor Green
    Write-Host "New size: $([math]::Round($newSize, 2)) KB (saved $([math]::Round($saved, 2)) KB)" -ForegroundColor Green
    Write-Host "Current project history preserved: $currentProject" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup location: $backupPath" -ForegroundColor Cyan
    Write-Host "To restore: Copy-Item '$backupPath' '$configPath' -Force" -ForegroundColor Cyan
} else {
    Write-Host "      No projects found in config" -ForegroundColor Yellow
}

Write-Host "Starting benchmark and builds..."

# List to keep track of background processes
$backgroundProcesses = @()

function Start-TrackedProcess {
    param (
        [string]$FilePath,
        [string]$Arguments
    )
    $proc = Start-Process -FilePath $FilePath -ArgumentList $Arguments -PassThru -WindowStyle Hidden
    $backgroundProcesses += $proc
    return $proc
}

function Stop-TrackedProcesses {
    Write-Host "Stopping background processes..."
    foreach ($proc in $backgroundProcesses) {
        if (!$proc.HasExited) {
            try {
                Stop-Process -Id $proc.Id -Force
                Write-Host "Stopped: $($proc.Path)"
            } catch {
                Write-Host "Failed to stop process $($proc.Id)"
            }
        }
    }
    $global:backgroundProcesses = @()  # Clear the list
}

try {
    powercfg /change standby-timeout-ac 0
    powercfg /change monitor-timeout-ac 0

    # === Benchmark Server ===
    Write-Host "Installing and building Benchmark Server"
    Set-Location ./server
    npm install
    npm run build
    npm run gen
    New-Item -ItemType Directory -Force -Path reports
    Set-Location ..

    # === Puppeteer Benchmark ===
    Write-Host "Building Puppeteer Benchmark"
    Set-Location ./benchmark
    npm install
    npm run build
    Set-Location ..

    # # === React Benchmark ===
    # Write-Host "Benchmarking React"
    # Set-Location ./react
    # npm install
    # npm install -g serve
    # npm run build
    # Start-TrackedProcess "npx" "serve -s build -p 3000"
    # Set-Location ../server
    # Start-TrackedProcess "npm" "run start react"
    # Start-Sleep -Seconds 30
    # Set-Location ../benchmark
    # npm run start http://localhost:3000/
    # Stop-TrackedProcesses
    # Set-Location ..
    # Set-Location react
    # Remove-Item -r ./build
    # Set-Location ..

    # === Angular Benchmark ===
    Write-Host "Benchmarking Angular"
    Set-Location ./angular
    npm install
    npm run build
    Start-TrackedProcess "npm" "run performance"
    Set-Location ../server
    Start-TrackedProcess "npm" "run start angular"
    Start-Sleep -Seconds 60
    Set-Location ../benchmark
    npm run start http://localhost:4200/
    Stop-TrackedProcesses
    Set-Location ..

    # === Svelte Benchmark ===
    # Write-Host "Benchmarking Svelte"
    # Set-Location ./svelte
    # npm install
    # npm run build
    # Start-TrackedProcess "npm" "run preview"
    # Set-Location ../server
    # Start-TrackedProcess "npm" "run start svelte"
    # Start-Sleep -Seconds 20
    # Set-Location ../benchmark
    # npm run start http://localhost:4173/
    # Stop-TrackedProcesses
    # Set-Location ..

    # # === Vanilla JS Benchmark ===
    # Write-Host "Benchmarking Vanilla JS"
    # npm install -g serve
    # Start-TrackedProcess "npx" "serve -s vanila -p 8123"
    # Set-Location ./server
    # Start-TrackedProcess "npm" "run start js"
    # Start-Sleep -Seconds 20
    # Set-Location ../benchmark
    # npm run start http://localhost:8123/
    # Stop-TrackedProcesses
    # Set-Location ..

    # === Collect Reports ===
    Write-Host "Collecting benchmark reports"
    New-Item -ItemType Directory -Force -Path ./reports/reports
    Copy-Item ./server/reports/*.html ./reports/reports -Force
    Copy-Item ./server/reports/*.csv ./reports/reports -Force

    # === Copy Dashboard ===
    Write-Host "`n Copying dashboard files"
    Copy-Item ./server/dashboard.html ./reports/index.html -Force

    Write-Host "All benchmarks completed successfully"
} catch {
    Write-Host "An error occurred: $_"
} finally {
    Stop-TrackedProcesses
    powercfg /change standby-timeout-ac 15
    powercfg /change monitor-timeout-ac 10
}


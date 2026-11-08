<#
.SYNOPSIS
    ADAPTCARE - Local Development Startup Script
.DESCRIPTION
    Checks dependencies, validates environment, and starts all ADAPTCARE services.
.NOTES
    Run from the project root: .\start-dev.ps1
#>

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$MLOnly,
    [switch]$SkipChecks
)

$ErrorActionPreference = "Continue"
$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = Get-Location }

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ADAPTCARE - Development Environment Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# --- Dependency Checks ---
if (-not $SkipChecks) {
    Write-Host "[CHECK] Verifying dependencies..." -ForegroundColor Yellow
    
    # Java
    try {
        $javaVersion = & java -version 2>&1 | Select-Object -First 1
        Write-Host "  [OK] Java: $javaVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Java is not installed or not on PATH" -ForegroundColor Red
        exit 1
    }

    # Maven
    try {
        $mvnVersion = & mvn -version 2>&1 | Select-Object -First 1
        Write-Host "  [OK] Maven: $mvnVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Maven is not installed or not on PATH" -ForegroundColor Red
        exit 1
    }

    # Node.js
    try {
        $nodeVersion = & node -v 2>&1
        Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Node.js is not installed or not on PATH" -ForegroundColor Red
        exit 1
    }

    # Python
    try {
        $pythonVersion = & python --version 2>&1
        Write-Host "  [OK] Python: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Python not found - ML service will not be available" -ForegroundColor Yellow
    }

    Write-Host ""
}

# --- Environment Variables ---
Write-Host "[CHECK] Verifying environment variables..." -ForegroundColor Yellow

$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Write-Host "  [OK] Loading .env file" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($key)) {
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
} else {
    Write-Host "  [WARN] No .env file found. Copy .env.example to .env and configure it." -ForegroundColor Yellow
    Write-Host "         Using default values for local development." -ForegroundColor Yellow
}

# Set defaults if not configured
$requiredVars = @{
    "DB_HOST" = "localhost"
    "DB_PORT" = "3306"
    "DB_NAME" = "adaptcare"
    "DB_USERNAME" = "root"
    "DB_PASSWORD" = ""
    "JWT_SECRET" = "adaptcare-default-secret-key-for-development-only-change-in-production-2024"
}

foreach ($var in $requiredVars.GetEnumerator()) {
    $current = [System.Environment]::GetEnvironmentVariable($var.Key)
    if (-not $current) {
        [System.Environment]::SetEnvironmentVariable($var.Key, $var.Value, "Process")
        if ($var.Key -eq "DB_PASSWORD" -and $var.Value -eq "") {
            Write-Host "  [WARN] $($var.Key) is not set. Set it in .env or as environment variable." -ForegroundColor Yellow
        } else {
            Write-Host "  [INFO] $($var.Key) = $($var.Value) (default)" -ForegroundColor Gray
        }
    } else {
        if ($var.Key -eq "DB_PASSWORD") {
            Write-Host "  [OK] $($var.Key) = ****" -ForegroundColor Green
        } else {
            Write-Host "  [OK] $($var.Key) = $current" -ForegroundColor Green
        }
    }
}

Write-Host ""

# --- MySQL Check ---
Write-Host "[CHECK] Testing MySQL connection..." -ForegroundColor Yellow
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlPath) {
    try {
        $dbHost = [System.Environment]::GetEnvironmentVariable("DB_HOST")
        $dbPort = [System.Environment]::GetEnvironmentVariable("DB_PORT")
        $dbUser = [System.Environment]::GetEnvironmentVariable("DB_USERNAME")
        $dbPass = [System.Environment]::GetEnvironmentVariable("DB_PASSWORD")
        
        $result = & mysql -h $dbHost -P $dbPort -u $dbUser --password="$dbPass" -e "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] MySQL connection successful" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] MySQL connection failed. Check DB_USERNAME and DB_PASSWORD in .env" -ForegroundColor Yellow
            Write-Host "         Error: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [WARN] Could not test MySQL connection" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [INFO] MySQL client not on PATH. Ensure MySQL server is running on port $([System.Environment]::GetEnvironmentVariable('DB_PORT'))." -ForegroundColor Gray
}

Write-Host ""

# --- Start Services ---
function Start-Backend {
    Write-Host "[START] Starting Backend (Spring Boot)..." -ForegroundColor Cyan
    $backendDir = Join-Path $projectRoot "backend"
    
    if (-not (Test-Path (Join-Path $backendDir "pom.xml"))) {
        Write-Host "  [FAIL] Backend pom.xml not found at $backendDir" -ForegroundColor Red
        return
    }

    Write-Host "  Building backend..." -ForegroundColor Gray
    Push-Location $backendDir
    & mvn clean package -DskipTests -q 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Backend build failed. Run 'mvn clean package' manually to see errors." -ForegroundColor Red
        Pop-Location
        return
    }
    Write-Host "  [OK] Backend built successfully" -ForegroundColor Green

    Write-Host "  Starting Spring Boot on port 8080..." -ForegroundColor Gray
    Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -WorkingDirectory $backendDir -NoNewWindow
    Pop-Location
}

function Start-Frontend {
    Write-Host "[START] Starting Frontend (React + Vite)..." -ForegroundColor Cyan
    $frontendDir = Join-Path $projectRoot "frontend"
    
    if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
        Write-Host "  [FAIL] Frontend package.json not found at $frontendDir" -ForegroundColor Red
        return
    }

    Push-Location $frontendDir
    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        & npm install 2>&1
    }

    Write-Host "  Starting Vite dev server on port 5173..." -ForegroundColor Gray
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $frontendDir -NoNewWindow
    Pop-Location
}

function Start-MLService {
    Write-Host "[START] Starting ML Service (FastAPI)..." -ForegroundColor Cyan
    $mlDir = Join-Path $projectRoot "ml-service"
    
    if (-not (Test-Path (Join-Path $mlDir "main.py"))) {
        Write-Host "  [SKIP] ML service not found at $mlDir" -ForegroundColor Yellow
        return
    }

    Push-Location $mlDir
    Write-Host "  Starting FastAPI on port 8000..." -ForegroundColor Gray
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $mlDir -NoNewWindow
    Pop-Location
}

if ($BackendOnly) {
    Start-Backend
} elseif ($FrontendOnly) {
    Start-Frontend
} elseif ($MLOnly) {
    Start-MLService
} else {
    Start-Backend
    Start-Sleep -Seconds 3
    Start-Frontend
    Start-Sleep -Seconds 1
    Start-MLService
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ADAPTCARE Services Starting" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:    http://localhost:8080" -ForegroundColor White
Write-Host "  Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host "  ML Service: http://localhost:8000" -ForegroundColor White
Write-Host "  Swagger:    http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "  Actuator:   http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host ""
Write-Host "  Demo Admin: admin@adaptcare.com / Admin@123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

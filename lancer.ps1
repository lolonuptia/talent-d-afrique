param(
  [switch]$Installer,   # recompile et reinstalle l'app
  [switch]$Logs         # affiche les logs OkHttp apres le lancement
)

$racine  = "C:\BLTN\Lolo\talent-afrique"
$gradle  = "$racine\mobile\app\build.gradle.kts"
$urlCible = "http://localhost:8000/api/"

# --- Environnement ---
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:LOCALAPPDATA\Android\Sdk\platform-tools;" + $env:Path

# --- 1. Corriger DEVICE_BASE_URL automatiquement (si elle pointe vers une IP) ---
$lignes = Get-Content $gradle
$modifie = $false
$nouvelles = foreach ($l in $lignes) {
  if ($l -match 'DEVICE_BASE_URL' -and $l -match 'http://\d+\.\d+\.\d+\.\d+:8000/api/') {
    $modifie = $true
    $l -replace 'http://\d+\.\d+\.\d+\.\d+:8000/api/', $urlCible
  } else { $l }
}
if ($modifie) {
  Copy-Item $gradle "$gradle.bak" -Force
  Set-Content -Path $gradle -Value $nouvelles -Encoding UTF8
  Write-Host "DEVICE_BASE_URL corrigee -> $urlCible (reinstallation de l'app forcee)" -ForegroundColor Yellow
  $Installer = $true
}

# --- 2. PostgreSQL ---
Start-Service postgresql-x64-16 -ErrorAction SilentlyContinue

# --- 3. Backend (nouvelle fenetre) ---
$backendOk = $false
try { Invoke-WebRequest "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 2 | Out-Null; $backendOk = $true } catch {}
if (-not $backendOk) {
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd $racine\backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
  Write-Host "Backend demarre dans une nouvelle fenetre" -ForegroundColor Green
} else {
  Write-Host "Backend deja en marche" -ForegroundColor Cyan
}

# --- 4. Frontend (nouvelle fenetre) ---
$frontOk = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontOk) {
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd $racine\frontend; npm run dev"
  Write-Host "Frontend demarre dans une nouvelle fenetre" -ForegroundColor Green
} else {
  Write-Host "Frontend deja en marche" -ForegroundColor Cyan
}

# --- 5. Telephone + tunnel USB ---
adb start-server | Out-Null
$appareils = adb devices | Select-String "\tdevice$"
if (-not $appareils) {
  Write-Host "AUCUN TELEPHONE DETECTE : branche le cable, active le debogage USB, accepte la fenetre sur le telephone." -ForegroundColor Red
  adb devices
  return
}
adb reverse --remove-all | Out-Null
adb reverse tcp:8000 tcp:8000
adb reverse --list

# --- 6. Compilation et installation (si demande ou si l'URL a change) ---
if ($Installer) {
  Set-Location "$racine\mobile"
  .\gradlew.bat installDebug
  if ($LASTEXITCODE -ne 0) { Write-Host "ECHEC de la compilation" -ForegroundColor Red; return }
}

# --- 7. Lancement de l'app ---
adb shell am force-stop com.talentdafrique.app
adb shell monkey -p com.talentdafrique.app -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Host "`nTout est pret. Appareil + tunnel + backend + app lances." -ForegroundColor Green

# --- 8. Logs facultatifs ---
if ($Logs) {
  adb logcat -c
  Read-Host "Appuie sur 'Se connecter' sur le telephone, attends le resultat, puis Entree"
  $p = (adb shell pidof com.talentdafrique.app | Out-String).Trim()
  $res = adb logcat -d --pid=$p | Select-String "okhttp" | Out-String
  $res | Set-Clipboard
  Write-Host "Logs copies dans le presse-papiers" -ForegroundColor Green
  $res
}

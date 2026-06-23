# Ejecuta este script con doble clic cuando hayas rellenado .env.local
# Acepta el popup de UAC que aparece

$action = {
  $svc = Get-Service -Name "musichomebridge.exe" -ErrorAction SilentlyContinue
  if ($null -eq $svc) {
    Write-Host "ERROR: Servicio no encontrado. Ejecuta primero: node install-service.js" -ForegroundColor Red
    pause
    exit 1
  }

  Write-Host "Reiniciando MusicHome Bridge..." -ForegroundColor Cyan
  Restart-Service -Name "musichomebridge.exe" -Force
  Start-Sleep -Seconds 2

  $svc = Get-Service -Name "musichomebridge.exe"
  if ($svc.Status -eq "Running") {
    Write-Host "OK: Servicio en ejecucion. La musica se reproducira al conectarte al WiFi." -ForegroundColor Green
  } else {
    Write-Host "ERROR: El servicio no arranco. Revisa que .env.local tenga los valores correctos." -ForegroundColor Red
    Write-Host "Logs en: C:\Users\kggp\music-home\bridge\logs\" -ForegroundColor Yellow
  }
  pause
}

Start-Process powershell -Verb RunAs -ArgumentList "-Command & { $action }" -Wait

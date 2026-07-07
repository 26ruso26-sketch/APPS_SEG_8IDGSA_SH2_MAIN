# script de prueba para verificar autenticación y modificación de estadísticas por admin

$baseUrl = "http://localhost:3000"

Write-Host "=== 1. Autenticación de Administrador ===" -ForegroundColor Cyan
$loginBody = @{ usuario = "admin"; password = "AdminWorldCup2026!" } | ConvertTo-Json

# Usar sesión web para capturar y enviar cookies automáticamente
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $webSession -UseBasicParsing
    Write-Host "Login exitoso! Respuesta: $($loginRes.Content)" -ForegroundColor Green
} catch {
    Write-Error "Fallo en login de administrador: $_"
    exit 1
}

# Ver cookies en la sesión
Write-Host "Cookies capturadas: $($webSession.Cookies.GetCookies($baseUrl) | Out-String)" -ForegroundColor Gray

Write-Host "`n=== 2. Probando Modificación con Estadísticas Válidas (México ID 1) ===" -ForegroundColor Cyan
# Stats válidas: PJ = 3, PG = 2, PE = 1, PP = 0, GF = 5, GC = 1 (Puntos: 7, Dif: 4)
# La regla PJ = PG + PE + PP (3 = 2 + 1 + 0) se cumple.
$statsBody = @{ pj = 3; pg = 2; pe = 1; pp = 0; gf = 5; gc = 1 } | ConvertTo-Json

try {
    $statsRes = Invoke-WebRequest -Uri "$baseUrl/api/admin/teams/1/stats" -Method Put -Body $statsBody -ContentType "application/json" -WebSession $webSession -UseBasicParsing
    Write-Host "Modificación exitosa (Código 200). Respuesta: $($statsRes.Content)" -ForegroundColor Green
} catch {
    $responseBody = [System.IO.StreamReader]($_.Exception.Response.GetResponseStream()) | %{$_.ReadToEnd()}
    Write-Error "Fallo en modificación de estadísticas válidas: $_. Detalles: $responseBody"
}

Write-Host "`n=== 3. Probando Regla de Integridad Inválida (PJ != PG + PE + PP) ===" -ForegroundColor Cyan
# Stats inválidas: PJ = 3, PG = 2, PE = 0, PP = 0, GF = 5, GC = 1 (PJ no es igual a PG + PE + PP)
$invalidStatsBody = @{ pj = 3; pg = 2; pe = 0; pp = 0; gf = 5; gc = 1 } | ConvertTo-Json

try {
    $statsRes = Invoke-WebRequest -Uri "$baseUrl/api/admin/teams/1/stats" -Method Put -Body $invalidStatsBody -ContentType "application/json" -WebSession $webSession -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Se permitieron estadísticas que violan PJ = PG + PE + PP!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    $responseBody = [System.IO.StreamReader]($_.Exception.Response.GetResponseStream()) | %{$_.ReadToEnd()}
    if ($statusCode -eq 400) {
        Write-Host "Regla violada rechazada exitosamente con Código 400. Mensaje: $responseBody" -ForegroundColor Green
    } else {
        Write-Host "Respuesta inesperada para estadísticas inválidas -> Código: $statusCode, Detalles: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n=== 4. Probando Intento de Modificación sin Autenticación ===" -ForegroundColor Cyan
# Sin usar la sesión autenticada
try {
    $statsRes = Invoke-WebRequest -Uri "$baseUrl/api/admin/teams/1/stats" -Method Put -Body $statsBody -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Se permitieron cambios sin autenticación!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    $responseBody = [System.IO.StreamReader]($_.Exception.Response.GetResponseStream()) | %{$_.ReadToEnd()}
    if ($statusCode -eq 401) {
        Write-Host "Intento sin sesión bloqueado exitosamente con Código 401. Detalles: $responseBody" -ForegroundColor Green
    } else {
        Write-Host "Respuesta inesperada para acceso sin sesión -> Código: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Finalizando pruebas de administración ===" -ForegroundColor Green

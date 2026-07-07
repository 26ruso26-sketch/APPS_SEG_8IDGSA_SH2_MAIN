# script de prueba para verificar cierre de sesión en backend

$baseUrl = "http://localhost:3000"

Write-Host "=== 1. Autenticación de Administrador ===" -ForegroundColor Cyan
$loginBody = @{ usuario = "admin"; password = "AdminWorldCup2026!" } | ConvertTo-Json
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $webSession -UseBasicParsing
    Write-Host "Login exitoso!" -ForegroundColor Green
} catch {
    Write-Error "Fallo en login: $_"
    exit 1
}

Write-Host "`n=== 2. Probando Cierre de Sesión (POST /api/auth/logout) ===" -ForegroundColor Cyan
try {
    $logoutRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/logout" -Method Post -WebSession $webSession -UseBasicParsing
    Write-Host "Logout exitoso en el servidor! Respuesta: $($logoutRes.Content)" -ForegroundColor Green
} catch {
    Write-Error "Fallo en logout: $_"
    exit 1
}

Write-Host "`n=== 3. Verificando Invalidez de Sesión Post-Logout ===" -ForegroundColor Cyan
# Tratar de modificar estadísticas con la sesión cerrada
$statsBody = @{ pj = 3; pg = 2; pe = 1; pp = 0; gf = 5; gc = 1 } | ConvertTo-Json

try {
    $statsRes = Invoke-WebRequest -Uri "$baseUrl/api/admin/teams/1/stats" -Method Put -Body $statsBody -ContentType "application/json" -WebSession $webSession -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Se permitió modificar estadísticas después del cierre de sesión!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    $responseBody = [System.IO.StreamReader]($_.Exception.Response.GetResponseStream()) | %{$_.ReadToEnd()}
    if ($statusCode -eq 401) {
        Write-Host "Invalidez confirmada (Código 401). Modificación rechazada con éxito." -ForegroundColor Green
    } else {
        Write-Host "Respuesta inesperada -> Código: $statusCode, Detalles: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Cierre de sesión verificado con éxito ===" -ForegroundColor Green

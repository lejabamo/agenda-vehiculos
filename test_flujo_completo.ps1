$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8001/api"
$MAILPIT = "http://localhost:8026/api/v1"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA END-TO-END - Agenda Vehiculos    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Limpiar Mailpit
Write-Host "[1] Limpiando bandeja Mailpit..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "$MAILPIT/messages" -Method Delete | Out-Null } catch {}
Write-Host "    OK - Bandeja limpia" -ForegroundColor Green

# PASO 2: Login
Write-Host "[2] Autenticando como admin..." -ForegroundColor Yellow
$loginBody = '{"email":"admin@educacion.cauca.gov.co","password":"Admin2024*"}'
$loginResp = Invoke-RestMethod -Uri "$BASE/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResp.access_token
$hdrs = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "    OK - Token obtenido. Usuario: $($loginResp.nombre)" -ForegroundColor Green

# PASO 3: Crear vehiculo (placa unica con timestamp)
Write-Host "[3] Creando vehiculo de prueba..." -ForegroundColor Yellow
$ts = [System.DateTime]::Now.ToString("mmss")
$placa = "SZ$ts"
$vBody = "{`"placa`":`"$placa`",`"marca`":`"Toyota`",`"modelo`":`"Hilux`",`"anio`":2022,`"color`":`"Blanco`"}"
$v = Invoke-RestMethod -Uri "$BASE/admin/vehiculos/" -Method Post -Headers $hdrs -Body $vBody
$vehiculoId = [int]$v.id
Write-Host "    OK - Vehiculo creado ID=$vehiculoId placa=$placa" -ForegroundColor Green

# PASO 4: Crear conductor (nombre unico)
Write-Host "[4] Creando conductor de prueba..." -ForegroundColor Yellow
$cBody = "{`"nombre`":`"Hermes Diaz $ts`",`"telefono`":`"3146789012`"}"
$c = Invoke-RestMethod -Uri "$BASE/admin/conductores/" -Method Post -Headers $hdrs -Body $cBody
$conductorId = [int]$c.id
Write-Host "    OK - Conductor creado ID=$conductorId nombre=$($c.nombre)" -ForegroundColor Green

# PASO 5: Crear solicitud publica
Write-Host "[5] Creando solicitud publica..." -ForegroundColor Yellow
$sBodyObj = @{
    dependencia_id = 1
    objeto_desplazamiento = "Visita inspeccion IE El Bordo"
    fecha_salida = "2026-03-25"
    fecha_regreso = "2026-03-25"
    num_dias = 1
    municipio_origen = "Popayan"
    municipio_destino = "El Bordo"
    fuera_departamento = $false
    lugar_destino_detalle = "IE El Bordo sede principal"
    lider_dependencia = "Juan Carlos Munoz"
    email_respuesta = "juan.munoz@educacion.cauca.gov.co"
    telefono_contacto = "3108765432"
    acepta_condiciones = $true
    comisionados = @(
        @{ nombre_completo = "Ana Lucia Gomez"; cargo = "Coordinadora"; tipo_vinculacion = "PLANTA" }
        @{ nombre_completo = "Pedro Torres"; cargo = "Contratista"; tipo_vinculacion = "CONTRATISTA" }
    )
}
$sBody = $sBodyObj | ConvertTo-Json -Depth 5
$sol = Invoke-RestMethod -Uri "$BASE/solicitudes/" -Method Post -ContentType "application/json" -Body $sBody
$solId = $sol.id
Write-Host "    OK - Solicitud #$solId creada. Estado: $($sol.estado)" -ForegroundColor Green

Start-Sleep -Seconds 2

# PASO 6: Email de recepcion
Write-Host "[6] Verificando email de recepcion en Mailpit..." -ForegroundColor Yellow
$m1 = Invoke-RestMethod -Uri "$MAILPIT/messages" -Method Get
Write-Host "    Emails en Mailpit: $($m1.messages_count)" -ForegroundColor Cyan
if ($m1.messages_count -gt 0) {
    Write-Host "    OK - Asunto: $($m1.messages[0].Subject)" -ForegroundColor Green
    Write-Host "    OK - Para:   $($m1.messages[0].To[0].Address)" -ForegroundColor Green
} else {
    Write-Host "    AVISO - No email de recepcion recibido" -ForegroundColor Red
}

# PASO 7: Aprobar
Write-Host "[7] Aprobando solicitud #$solId (v=$vehiculoId c=$conductorId)..." -ForegroundColor Yellow
$aBody = "{`"vehiculo_id`":$vehiculoId,`"conductor_id`":$conductorId,`"observaciones`":`"Aprobado. Coordinar 1h antes.`"}"
$aprobado = Invoke-RestMethod -Uri "$BASE/admin/solicitudes/$solId/aprobar" -Method Patch -Headers $hdrs -Body $aBody
Write-Host "    OK - Estado: $($aprobado.estado)" -ForegroundColor Green

Start-Sleep -Seconds 2

# PASO 8: Email de aprobacion
Write-Host "[8] Verificando emails de aprobacion en Mailpit..." -ForegroundColor Yellow
$m2 = Invoke-RestMethod -Uri "$MAILPIT/messages" -Method Get
Write-Host "    Total emails en bandeja: $($m2.messages_count)" -ForegroundColor Cyan
foreach ($mail in $m2.messages) {
    Write-Host "    -- $($mail.Subject)" -ForegroundColor White
    Write-Host "       Para: $($mail.To[0].Address)" -ForegroundColor Gray
}

# RESUMEN
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Solicitud #$solId - Estado: $($aprobado.estado)" -ForegroundColor White
Write-Host "  Emails en Mailpit: $($m2.messages_count)" -ForegroundColor White
Write-Host ""
Write-Host "  Mailpit UI: http://localhost:8025" -ForegroundColor Cyan
Write-Host "  Swagger:    http://localhost:8001/api/docs" -ForegroundColor Cyan
Write-Host ""

if ($aprobado.estado -eq "APROBADO" -and $m2.messages_count -ge 1) {
    Write-Host "  >>> PRUEBA EXITOSA - Flujo completo funcionando! <<<" -ForegroundColor Green
} elseif ($aprobado.estado -eq "APROBADO") {
    Write-Host "  Solicitud aprobada pero NO llegaron emails a Mailpit" -ForegroundColor Red
    Write-Host "  Revisar configuracion SMTP en .env (SMTP_PORT=1025, SMTP_HOST=localhost)" -ForegroundColor Yellow
} else {
    Write-Host "  PRUEBA FALLIDA" -ForegroundColor Red
}
Write-Host ""

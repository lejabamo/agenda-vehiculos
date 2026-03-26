const BASE = import.meta.env.VITE_API_URL || '/vehiculos/api'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error de autenticación')
  return res.json()
}

// ── Catálogos públicos ────────────────────────────────────────────────────────

export async function getMunicipios(q = '') {
  const res = await fetch(`${BASE}/municipios/?q=${encodeURIComponent(q)}`)
  return res.json()
}

export async function getDependencias(q = '') {
  const res = await fetch(`${BASE}/dependencias/?q=${encodeURIComponent(q)}`)
  return res.json()
}

// ── Solicitudes públicas ──────────────────────────────────────────────────────

export async function createSolicitud(data: unknown) {
  const res = await fetch(`${BASE}/solicitudes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error al enviar la solicitud')
  }
  return res.json()
}

export async function getLideres(q = '') {
  const res = await fetch(`${BASE}/solicitudes/lideres`)
  const all = await res.json() as { id: number; nombre: string; dependencia: string; dependencia_id: number; email: string }[]
  return all.filter(l => l.nombre.toLowerCase().includes(q.toLowerCase()))
}

export async function getDisponibilidad(desde: string, hasta: string) {
  const res = await fetch(`${BASE}/solicitudes/disponibilidad?desde=${desde}&hasta=${hasta}`)
  return res.json()
}

// ── Admin: Solicitudes ────────────────────────────────────────────────────────

export async function getSolicitudes(token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/admin/solicitudes?${qs}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener solicitudes')
  return res.json()
}

export async function getSolicitudAdmin(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener solicitud')
  return res.json()
}

export async function aprobarSolicitud(token: string, id: number, data: unknown) {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}/aprobar`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al aprobar')
  return res.json()
}

export async function rechazarSolicitud(token: string, id: number, observaciones: string) {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}/rechazar`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ observaciones }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al rechazar')
  return res.json()
}

export async function cancelarSolicitud(token: string, id: number, observaciones = '') {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}/cancelar`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ observaciones }),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al cancelar')
  return res.json()
}

export async function reagendarSolicitud(token: string, id: number, data: unknown) {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}/reagendar`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al reagendar')
  return res.json()
}

export async function finalizarSolicitud(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/solicitudes/${id}/finalizar`, {
    method: 'PATCH', headers: authHeaders(token),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al finalizar')
  return res.json()
}

export async function getDiasLibres(token: string, vehiculoId: number, desde?: string) {
  const qs = new URLSearchParams({ vehiculo_id: String(vehiculoId), ...(desde ? { desde } : {}) })
  const res = await fetch(`${BASE}/admin/dias-libres?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

export async function getCalendario(token: string, desde?: string, hasta?: string) {
  const qs = new URLSearchParams({ ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) })
  const res = await fetch(`${BASE}/admin/calendario?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

export async function getVerificarCruce(token: string, params: Record<string, any>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/admin/verificar-cruce?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

// ── Admin: Vehículos ──────────────────────────────────────────────────────────

export async function getVehiculos(token: string) {
  const res = await fetch(`${BASE}/admin/vehiculos/`, { headers: authHeaders(token) })
  return res.json()
}

export async function createVehiculo(token: string, data: unknown) {
  const res = await fetch(`${BASE}/admin/vehiculos/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al crear vehículo')
  return res.json()
}

export async function updateVehiculo(token: string, id: number, data: unknown) {
  const res = await fetch(`${BASE}/admin/vehiculos/${id}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al actualizar vehículo')
  return res.json()
}

// ── Admin: Conductores ────────────────────────────────────────────────────────

export async function getConductores(token: string) {
  const res = await fetch(`${BASE}/admin/conductores/`, { headers: authHeaders(token) })
  return res.json()
}

export async function createConductor(token: string, data: unknown) {
  const res = await fetch(`${BASE}/admin/conductores/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al crear conductor')
  return res.json()
}

export async function updateConductor(token: string, id: number, data: unknown) {
  const res = await fetch(`${BASE}/admin/conductores/${id}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al actualizar conductor')
  return res.json()
}

export async function deleteConductor(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/conductores/${id}`, {
    method: 'DELETE', headers: authHeaders(token),
  })
  return res.json()
}

// ── Admin: Analytics ─────────────────────────────────────────────────────────

export async function getAnalyticsMunicipios(token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/admin/analytics/municipios?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

export async function getAnalyticsInstituciones(token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/admin/analytics/instituciones?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

export async function getAnalyticsDependencias(token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/admin/analytics/dependencias?${qs}`, { headers: authHeaders(token) })
  return res.json()
}

export async function getAnalyticsResumen(token: string) {
  const res = await fetch(`${BASE}/admin/analytics/resumen`, { headers: authHeaders(token) })
  return res.json()
}

// ── Export ────────────────────────────────────────────────────────────────────

export function getExportUrl(_token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  return `${BASE}/admin/export?${qs}`
}

// ── Directorio (Admin) ────────────────────────────────────────────────────────
export async function getAdminDirectorioDependencias(token: string) {
  const res = await fetch(`${BASE}/admin/directorio/dependencias`, { headers: authHeaders(token) })
  return res.json()
}

export async function createAdminDirectorioDependencia(token: string, data: any) {
  const res = await fetch(`${BASE}/admin/directorio/dependencias`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateAdminDirectorioDependencia(token: string, id: number, data: any) {
  const res = await fetch(`${BASE}/admin/directorio/dependencias/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteAdminDirectorioDependencia(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/directorio/dependencias/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  })
  return res.json()
}

export async function getAdminDirectorioLideres(token: string) {
  const res = await fetch(`${BASE}/admin/directorio/lideres`, { headers: authHeaders(token) })
  return res.json()
}

export async function createAdminDirectorioLider(token: string, data: any) {
  const res = await fetch(`${BASE}/admin/directorio/lideres`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateAdminDirectorioLider(token: string, id: number, data: any) {
  const res = await fetch(`${BASE}/admin/directorio/lideres/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteAdminDirectorioLider(token: string, id: number) {
  const res = await fetch(`${BASE}/admin/directorio/lideres/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  })
  return res.json()
}

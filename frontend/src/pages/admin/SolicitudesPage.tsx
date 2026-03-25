import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSolicitudes } from '../../services/api'

const BADGE_CLASS: Record<string, string> = {
  PENDIENTE: 'badge-pendiente', APROBADO: 'badge-aprobado',
  RECHAZADO: 'badge-rechazado', CANCELADO: 'badge-cancelado', REAGENDADO: 'badge-reagendado',
}

export default function SolicitudesPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ desde: '', hasta: '', estado: '', dependencia_id: '' })

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filters.desde) params.desde = filters.desde
      if (filters.hasta) params.hasta = filters.hasta
      if (filters.estado) params.estado = filters.estado
      const data = await getSolicitudes(token, params)
      setSolicitudes(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const exportUrl = `/api/admin/export?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).toString()}`

  return (
    <>
      <h1 className="page-title">Solicitudes de Vehículo</h1>
      <p className="page-subtitle">Gestione todas las solicitudes recibidas</p>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="form-group">
          <label className="form-label">Desde</label>
          <input type="date" className="form-input" value={filters.desde} onChange={e => setFilters(f => ({ ...f, desde: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Hasta</label>
          <input type="date" className="form-input" value={filters.hasta} onChange={e => setFilters(f => ({ ...f, hasta: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-select" value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos</option>
            {['PENDIENTE','APROBADO','RECHAZADO','CANCELADO','REAGENDADO'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={load}>Buscar</button>
          <a href={exportUrl} className="btn btn-outline" target="_blank" rel="noopener noreferrer">⬇ Excel</a>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
          ) : solicitudes.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><p>No se encontraron solicitudes</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Dependencia</th><th>Objeto</th><th>Destino</th>
                  <th>Salida</th><th>Regreso</th><th>Estado</th><th>Vehículo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s: Record<string, unknown>) => (
                  <tr key={s.id as number}>
                    <td><strong>#{s.id as number}</strong></td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dependencia as string}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.objeto_desplazamiento as string}</td>
                    <td>{s.municipio_destino as string}{s.fuera_departamento ? ' 🌐' : ''}</td>
                    <td>{s.fecha_salida as string}</td>
                    <td>{s.fecha_regreso as string}</td>
                    <td><span className={`badge ${BADGE_CLASS[s.estado as string] || ''}`}>{s.estado as string}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.vehiculo as string || '—'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/solicitudes/${s.id}`)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

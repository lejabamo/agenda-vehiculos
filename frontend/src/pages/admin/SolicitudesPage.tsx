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
      <h1 className="page-title" id="page-heading">Solicitudes de Vehículo</h1>
      <p className="page-subtitle">Gestione todas las solicitudes recibidas</p>

      {/* Filtros */}
      <section className="filters-bar" aria-label="Filtros de búsqueda">
        <div className="form-group">
          <label className="form-label" htmlFor="filter-desde">Desde</label>
          <input id="filter-desde" type="date" className="form-input" value={filters.desde} onChange={e => setFilters(f => ({ ...f, desde: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="filter-hasta">Hasta</label>
          <input id="filter-hasta" type="date" className="form-input" value={filters.hasta} onChange={e => setFilters(f => ({ ...f, hasta: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="filter-estado">Estado</label>
          <select id="filter-estado" className="form-select" value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            {['PENDIENTE','APROBADO','RECHAZADO','CANCELADO','REAGENDADO'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={load} aria-label="Aplicar filtros y buscar">Buscar</button>
          <a href={exportUrl} className="btn btn-outline" target="_blank" rel="noopener noreferrer" aria-label="Exportar resultados a Excel">⬇ Excel</a>
        </div>
      </section>

      <div className="card">
        <div className="table-wrapper">
          <div aria-live="polite">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }} role="status"><div className="spinner" aria-label="Cargando solicitudes..." /></div>
            ) : solicitudes.length === 0 ? (
              <div className="empty-state" role="status"><div className="empty-state-icon">📋</div><p>No se encontraron solicitudes</p></div>
            ) : (
              <table className="table" aria-labelledby="page-heading">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Dependencia</th>
                    <th scope="col">Objeto</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Salida</th>
                    <th scope="col">Regreso</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Vehículo</th>
                    <th scope="col"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s: any) => (
                    <tr key={s.id}>
                      <td><strong>#{s.id}</strong></td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dependencia}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.objeto_desplazamiento}</td>
                      <td>{s.municipio_destino}{s.fuera_departamento ? <span aria-label="Fuera del departamento"> 🌐</span> : ''}</td>
                      <td>{s.fecha_salida}</td>
                      <td>{s.fecha_regreso}</td>
                      <td><span className={`badge ${BADGE_CLASS[s.estado as string] || ''}`} aria-label={`Estado: ${s.estado}`}>{s.estado as string}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.vehiculo || '—'}</td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => navigate(`/admin/solicitudes/${s.id}`)}
                          aria-label={`Ver detalles de la solicitud #${s.id}`}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

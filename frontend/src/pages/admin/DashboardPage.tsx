import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAnalyticsResumen, getSolicitudes } from '../../services/api'

interface Resumen { pendientes: number; en_campo_hoy: number; total_mes: number }
interface Solicitud { id: number; dependencia: string; municipio_destino: string; fecha_salida: string; estado: string; lider_dependencia: string }

const BADGE_CLASS: Record<string, string> = {
  PENDIENTE: 'badge-pendiente', APROBADO: 'badge-aprobado',
  RECHAZADO: 'badge-rechazado', CANCELADO: 'badge-cancelado', REAGENDADO: 'badge-reagendado',
  FINALIZADA: 'badge-finalizada',
}

export default function DashboardPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [pendientes, setPendientes] = useState<Solicitud[]>([])

  useEffect(() => {
    if (!token) return
    getAnalyticsResumen(token).then(setResumen).catch(() => {})
    getSolicitudes(token, { estado: 'PENDIENTE' }).then(setPendientes).catch(() => {})
  }, [token])

  return (
    <>
      <h1 className="page-title">Panel de Control</h1>
      <p className="page-subtitle">Resumen de actividad del sistema de vehículos</p>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Solicitudes Pendientes</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{resumen?.pendientes ?? '—'}</span>
          <span className="metric-sub">Requieren revisión</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Vehículos en Campo Hoy</span>
          <span className="metric-value" style={{ color: 'var(--color-primary)' }}>{resumen?.en_campo_hoy ?? '—'}</span>
          <span className="metric-sub">Comisiones activas</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Solicitudes Mes</span>
          <span className="metric-value">{resumen?.total_mes ?? '—'}</span>
          <span className="metric-sub">Mes actual</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⏳ Solicitudes Pendientes de Revisión</span>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/solicitudes')}>Ver todas</button>
        </div>
        <div className="table-wrapper">
          {pendientes.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>No hay solicitudes pendientes</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Dependencia</th><th>Destino</th><th>Fecha Salida</th><th>Líder</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pendientes.slice(0, 10).map(s => (
                  <tr key={s.id}>
                    <td><strong>#{s.id}</strong></td>
                    <td>{s.dependencia}</td>
                    <td>{s.municipio_destino}</td>
                    <td>{s.fecha_salida}</td>
                    <td>{s.lider_dependencia}</td>
                    <td><span className={`badge ${BADGE_CLASS[s.estado] || ''}`}>{s.estado}</span></td>
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

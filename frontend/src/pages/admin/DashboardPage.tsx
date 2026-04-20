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
      <h1 className="page-title" id="page-heading">Panel de Control</h1>
      <p className="page-subtitle">Resumen de actividad del sistema de vehículos</p>

      {/* Screen Reader Summary */}
      <section className="sr-only" aria-labelledby="sr-summary-heading">
        <h2 id="sr-summary-heading">Resumen del sistema para asistencia</h2>
        <p>
          Actualmente hay {resumen?.pendientes ?? 0} solicitudes pendientes que requieren su atención. 
          Hoy tenemos {resumen?.en_campo_hoy ?? 0} vehículos en comisión. 
          En este mes se han procesado {resumen?.total_mes ?? 0} solicitudes en total.
        </p>
      </section>

      <ul className="metrics-grid" role="list" aria-label="Indicadores clave de desempeño">
        <li className="metric-card">
          <span className="metric-label" id="label-pendientes">Solicitudes Pendientes</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }} aria-labelledby="label-pendientes">{resumen?.pendientes ?? '—'}</span>
          <span className="metric-sub">Requieren revisión</span>
        </li>
        <li className="metric-card">
          <span className="metric-label" id="label-campo">Vehículos en Campo Hoy</span>
          <span className="metric-value" style={{ color: 'var(--color-primary)' }} aria-labelledby="label-campo">{resumen?.en_campo_hoy ?? '—'}</span>
          <span className="metric-sub">Comisiones activas</span>
        </li>
        <li className="metric-card">
          <span className="metric-label" id="label-total">Total Solicitudes Mes</span>
          <span className="metric-value" aria-labelledby="label-total">{resumen?.total_mes ?? '—'}</span>
          <span className="metric-sub">Mes actual</span>
        </li>
      </ul>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span id="title-pendientes">⏳ Solicitudes Pendientes de Revisión</span>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/solicitudes')} aria-label="Ver todas las solicitudes">Ver todas</button>
        </div>
        <div className="table-wrapper">
          {pendientes.length === 0 ? (
            <div className="empty-state" role="status"><div className="empty-state-icon">✅</div><p>No hay solicitudes pendientes</p></div>
          ) : (
            <table className="table" aria-labelledby="title-pendientes">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Dependencia</th>
                  <th scope="col">Destino</th>
                  <th scope="col">Fecha Salida</th>
                  <th scope="col">Líder</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
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
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => navigate(`/admin/solicitudes/${s.id}`)}
                        aria-label={`Ver detalles de solicitud número ${s.id}`}
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
    </>
  )
}

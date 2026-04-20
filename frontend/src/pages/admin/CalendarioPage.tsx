import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCalendario } from '../../services/api'

interface CalEvent { id: number; title: string; start: string; end: string; estado: string; vehiculo: string; conductor: string }

const COLOR: Record<string, string> = {
  APROBADO: 'var(--color-primary)',
  PENDIENTE: 'var(--color-accent)',
}

export default function CalendarioPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const now = new Date()
    const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const hasta = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0]
    getCalendario(token, desde, hasta)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [token])

  const byDate = events.reduce<Record<string, CalEvent[]>>((acc, e) => {
    const d = e.start
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})

  return (
    <>
      <h1 className="page-title" id="page-heading">Calendario de Vehículos</h1>
      <p className="page-subtitle">Vista de ocupación de la flota</p>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }} role="status"><div className="spinner" aria-label="Cargando calendario..." /></div>
      ) : events.length === 0 ? (
        <div className="empty-state" role="status"><div className="empty-state-icon">📅</div><p>No hay comisiones programadas</p></div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div 
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} 
              role="list" 
              aria-label="Cronograma de comisiones por fecha"
            >
              {Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([fecha, evts]) => (
                <div 
                  key={fecha} 
                  style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }} 
                  role="listitem"
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span className="sr-only">Fecha: </span>
                    📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {evts.map(e => (
                      <li key={e.id} style={{
                        background: COLOR[e.estado] || 'var(--color-text-muted)',
                        color: 'white', borderRadius: 8, padding: '0.5rem 0.75rem',
                        marginBottom: '0.375rem', fontSize: '0.8rem',
                      }}>
                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                        <div style={{ opacity: .85 }}>
                          <span className="sr-only">Vehículo: </span>🚗 {e.vehiculo} 
                          <span style={{ margin: '0 0.25rem' }}>—</span>
                          <span className="sr-only">Conductor: </span>👤 {e.conductor} 
                          <span style={{ margin: '0 0.25rem' }}>|</span>
                          <span className="sr-only">Finaliza el: </span>Hasta: {e.end}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

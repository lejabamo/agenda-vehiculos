import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAnalyticsMunicipios, getAnalyticsInstituciones, getAnalyticsDependencias } from '../../services/api'

interface Ranking { municipio_destino?: string; objeto_desplazamiento?: string; nombre?: string; total: number }

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [municipios, setMunicipios] = useState<Ranking[]>([])
  const [instituciones, setInstituciones] = useState<Ranking[]>([])
  const [dependencias, setDependencias] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      getAnalyticsMunicipios(token),
      getAnalyticsInstituciones(token),
      getAnalyticsDependencias(token),
    ]).then(([m, i, d]) => { setMunicipios(m); setInstituciones(i); setDependencias(d) })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>

  const maxMun = municipios[0]?.total || 1
  const maxIns = instituciones[0]?.total || 1
  const maxDep = dependencias[0]?.total || 1

  return (
    <>
      <h1 className="page-title">Analytics</h1>
      <p className="page-subtitle">Análisis de comisiones y uso de vehículos</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Municipios */}
        <div className="card">
          <div className="card-header">📍 Municipios más visitados</div>
          <div className="card-body">
            {municipios.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>Sin datos aún</div>
            ) : (
              municipios.map((m, i) => (
                <Bar key={i} label={m.municipio_destino || '—'} value={m.total} max={maxMun} />
              ))
            )}
          </div>
        </div>

        {/* Dependencias */}
        <div className="card">
          <div className="card-header">🏛 Solicitudes por dependencia</div>
          <div className="card-body">
            {dependencias.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>Sin datos aún</div>
            ) : (
              dependencias.map((d, i) => (
                <Bar key={i} label={d.nombre || '—'} value={d.total} max={maxDep} />
              ))
            )}
          </div>
        </div>

        {/* Instituciones/Objetos */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">📋 Objetos/Instituciones más frecuentes</div>
          <div className="card-body">
            {instituciones.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>Sin datos aún</div>
            ) : (
              instituciones.map((ins, i) => (
                <Bar key={i} label={ins.objeto_desplazamiento || '—'} value={ins.total} max={maxIns} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

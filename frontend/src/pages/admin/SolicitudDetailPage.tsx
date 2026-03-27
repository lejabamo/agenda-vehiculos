import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getSolicitudAdmin, getVehiculos, getConductores, getDiasLibres, getVerificarCruce,
  aprobarSolicitud, rechazarSolicitud, cancelarSolicitud, reagendarSolicitud, finalizarSolicitud
} from '../../services/api'

const BADGE: Record<string, string> = {
  PENDIENTE: 'badge-pendiente', APROBADO: 'badge-aprobado',
  RECHAZADO: 'badge-rechazado', CANCELADO: 'badge-cancelado', REAGENDADO: 'badge-reagendado',
  FINALIZADA: 'badge-finalizada',
}

interface Solicitud {
  id: number
  estado: string
  dependencia: string
  objeto_desplazamiento: string
  fecha_salida: string
  fecha_regreso: string
  num_dias: number
  municipio_origen: string
  municipio_destino: string
  fuera_departamento: boolean
  lugar_destino_detalle: string
  lider_dependencia: string
  email_respuesta: string
  telefono_contacto: string
  observaciones_admin?: string
  vehiculo?: { id: number; placa: string; marca: string; modelo: string }
  conductor?: { id: number; nombre: string; telefono: string }
  comisionados: { nombre_completo: string; cargo: string; tipo_vinculacion: string }[]
}

export default function SolicitudDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [sol, setSol] = useState<Solicitud | null>(null)
  const [vehiculos, setVehiculos] = useState<{ id: number; placa: string; marca: string; modelo: string; activo: boolean }[]>([])
  const [conductores, setConductores] = useState<{ id: number; nombre: string; telefono: string; activo: boolean }[]>([])
  const [diasLibres, setDiasLibres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'aprobar' | 'rechazar' | 'cancelar' | 'reagendar' | 'finalizar' | null>(null)
  const [form, setForm] = useState({ vehiculo_id: '', conductor_id: '', observaciones: '', fecha_salida: '', fecha_regreso: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<{ type: 'V' | 'C' | null; msg: string }>({ type: null, msg: '' })

  useEffect(() => {
    if (!token || !id) return
    setLoading(true)
    Promise.all([
      getSolicitudAdmin(token, Number(id)),
      getVehiculos(token),
      getConductores(token),
    ]).then(([s, v, c]) => { setSol(s); setVehiculos(v); setConductores(c) })
      .finally(() => setLoading(false))
  }, [token, id])

  // Efecto para verificar conflictos automáticamente cuando cambian los datos relevantes
  useEffect(() => {
    const runCheck = async () => {
      if (!token || !sol || !modal) return
      if (!['aprobar', 'reagendar'].includes(modal)) return

      const vId = form.vehiculo_id
      const cId = form.conductor_id
      const desde = modal === 'reagendar' ? form.fecha_salida : sol.fecha_salida
      const hasta = modal === 'reagendar' ? form.fecha_regreso : sol.fecha_regreso

      if (!vId || !cId || !desde || !hasta) {
        setConflict({ type: null, msg: '' })
        return
      }

      try {
        const res = await getVerificarCruce(token, {
          vehiculo_id: vId,
          conductor_id: cId,
          desde,
          hasta,
          excluir_solicitud_id: sol.id
        })

        if (res.conflicto_vehiculo) {
          setConflict({ type: 'V', msg: `El vehículo ya tiene una comisión aprobada del ${res.conflicto_vehiculo.desde} al ${res.conflicto_vehiculo.hasta} (Solicitud #${res.conflicto_vehiculo.id})` })
        } else if (res.conflicto_conductor) {
          setConflict({ type: 'C', msg: `El conductor ya tiene una comisión aprobada del ${res.conflicto_conductor.desde} al ${res.conflicto_conductor.hasta} (Solicitud #${res.conflicto_conductor.id})` })
        } else {
          setConflict({ type: null, msg: '' })
        }
      } catch (e) {
        console.error('Error al verificar cruce:', e)
      }
    }

    runCheck()
  }, [token, sol, modal, form.vehiculo_id, form.conductor_id, form.fecha_salida, form.fecha_regreso])

  const fetchDiasLibres = async (vehiculoId: string) => {
    if (!token || !vehiculoId) return
    const res = await getDiasLibres(token, Number(vehiculoId))
    setDiasLibres(res.dias_libres || [])
  }

  const handleAction = async () => {
    if (!token || !id) return
    setSaving(true); setError('')
    try {
      if (modal === 'aprobar') {
        await aprobarSolicitud(token, Number(id), {
          vehiculo_id: Number(form.vehiculo_id),
          conductor_id: Number(form.conductor_id),
          observaciones: form.observaciones,
        })
      } else if (modal === 'rechazar') {
        await rechazarSolicitud(token, Number(id), form.observaciones)
      } else if (modal === 'cancelar') {
        await cancelarSolicitud(token, Number(id), form.observaciones)
      } else if (modal === 'reagendar') {
        await reagendarSolicitud(token, Number(id), {
          vehiculo_id: Number(form.vehiculo_id),
          conductor_id: Number(form.conductor_id),
          fecha_salida: form.fecha_salida,
          fecha_regreso: form.fecha_regreso,
          observaciones: form.observaciones,
        })
      } else if (modal === 'finalizar') {
        await finalizarSolicitud(token, Number(id))
      }
      setModal(null)
      navigate('/admin/solicitudes')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" /></div>
  if (!sol) return <div className="empty-state">Solicitud no encontrada</div>

  const estado = sol.estado as string
  const canAprobar = estado === 'PENDIENTE'
  const canRechazar = estado === 'PENDIENTE'
  const canCancelar = !['CANCELADO', 'FINALIZADA'].includes(estado)
  const canReagendar = !['FINALIZADA'].includes(estado)
  const canFinalizar = estado === 'APROBADO'

  const comisionados = sol.comisionados as { nombre_completo: string; cargo: string; tipo_vinculacion: string }[]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/solicitudes')}>← Volver</button>
        <h1 className="page-title" style={{ margin: 0 }}>Solicitud #{sol.id as number}</h1>
        <span className={`badge ${BADGE[estado] || ''}`}>{estado}</span>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {canAprobar && <button className="btn btn-success" onClick={() => { setModal('aprobar'); setForm(f => ({ ...f, vehiculo_id: '', conductor_id: '', observaciones: '' })) }}>✓ Aprobar</button>}
        {canFinalizar && <button className="btn btn-success" onClick={() => setModal('finalizar')}>🏁 Finalizar Comisión</button>}
        {canRechazar && <button className="btn btn-danger" onClick={() => setModal('rechazar')}>✕ Rechazar</button>}
        {canReagendar && <button className="btn btn-accent" onClick={() => { setModal('reagendar'); setDiasLibres([]) }}>📅 Reagendar</button>}
        {canCancelar && <button className="btn btn-outline" onClick={() => setModal('cancelar')}>Cancelar</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Desplazamiento */}
        <div className="card">
          <div className="card-header">📍 Desplazamiento</div>
          <div className="card-body" style={{ fontSize: '0.875rem' }}>
            <Info label="Dependencia" value={sol.dependencia} />
            <Info label="Objeto" value={sol.objeto_desplazamiento} />
            <Info label="Salida" value={sol.fecha_salida} />
            <Info label="Regreso" value={sol.fecha_regreso} />
            <Info label="Días" value={String(sol.num_dias)} />
            <Info label="Origen" value={sol.municipio_origen} />
            <Info label="Destino" value={sol.municipio_destino + (sol.fuera_departamento ? ' (Fuera del Cauca)' : '')} />
            <Info label="Lugar" value={sol.lugar_destino_detalle} />
          </div>
        </div>

        {/* Contacto */}
        <div className="card">
          <div className="card-header">📧 Contacto</div>
          <div className="card-body" style={{ fontSize: '0.875rem' }}>
            <Info label="Líder" value={sol.lider_dependencia} />
            <Info label="Email" value={sol.email_respuesta} />
            <Info label="Teléfono" value={sol.telefono_contacto} />
            {sol.vehiculo && <Info label="Vehículo" value={`${sol.vehiculo.placa} — ${sol.vehiculo.marca} ${sol.vehiculo.modelo}`} />}
            {sol.conductor && <Info label="Conductor" value={`${sol.conductor.nombre} (${sol.conductor.telefono})`} />}
            {sol.observaciones_admin && <Info label="Obs. Admin" value={sol.observaciones_admin} />}
          </div>
        </div>
      </div>

      {/* Comisionados */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">👥 Comisionados</div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>Nombre completo</th><th>Cargo</th><th>Vinculación</th></tr></thead>
            <tbody>
              {comisionados.map((c, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><strong>{c.nombre_completo}</strong></td>
                  <td>{c.cargo}</td>
                  <td><span className="badge badge-pendiente" style={{ fontSize: '0.7rem' }}>{c.tipo_vinculacion}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {modal === 'aprobar' && '✓ Aprobar Solicitud'}
                {modal === 'rechazar' && '✕ Rechazar Solicitud'}
                {modal === 'cancelar' && 'Cancelar Solicitud'}
                {modal === 'reagendar' && '📅 Reagendar Solicitud'}
                {modal === 'finalizar' && '🏁 Finalizar Comisión'}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>⚠️ {error}</div>}

              {modal === 'finalizar' && (
                <div style={{ padding: '1rem 0' }}>
                  <p>¿Está seguro que desea marcar esta comisión como **finalizada**?</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Esta acción liberará el vehículo para nuevas solicitudes.</p>
                </div>
              )}

              {(modal === 'aprobar' || modal === 'reagendar') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Vehículo a asignar</label>
                    <select className="form-select" value={form.vehiculo_id}
                      onChange={e => { setForm(f => ({ ...f, vehiculo_id: e.target.value })); fetchDiasLibres(e.target.value) }}>
                      <option value="">Seleccione un vehículo...</option>
                      {vehiculos.filter(v => v.activo).map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
                    </select>
                  </div>

                  {diasLibres.length > 0 && (
                    <div style={{ background: 'var(--color-info-bg)', padding: '0.75rem', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-info)' }}>
                      📅 <strong>Días libres del vehículo:</strong> {diasLibres.slice(0, 5).join(', ')}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Conductor a asignar</label>
                    <select className="form-select" value={form.conductor_id}
                      onChange={e => setForm(f => ({ ...f, conductor_id: e.target.value }))}>
                      <option value="">Seleccione un conductor...</option>
                      {conductores.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
                    </select>
                  </div>

                  {conflict.msg && (
                    <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid var(--color-danger)', fontSize: '0.875rem' }}>
                      ⚠️ <strong>¡Conflicto de Agenda!:</strong> {conflict.msg}
                    </div>
                  )}
                </>
              )}

              {modal === 'reagendar' && (
                <div className="form-row">
                   <div className="form-group">
                    <label className="form-label">Nueva fecha de salida</label>
                    <input type="date" className="form-input" value={form.fecha_salida}
                      onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nueva fecha de regreso</label>
                    <input type="date" className="form-input" value={form.fecha_regreso}
                      onChange={e => setForm(f => ({ ...f, fecha_regreso: e.target.value }))} />
                  </div>
                </div>
              )}

              {(modal !== 'finalizar') && (
                <div className="form-group">
                  <label className="form-label">Observaciones {modal === 'rechazar' ? <span className="required">*</span> : '(opcional)'}</label>
                  <textarea className="form-textarea" value={form.observaciones}
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder={modal === 'rechazar' ? 'Explique el motivo del rechazo...' : 'Notas adicionales...'} rows={3} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className={`btn ${['aprobar', 'reagendar', 'finalizar'].includes(modal) ? 'btn-success' : modal === 'rechazar' ? 'btn-danger' : 'btn-outline'}`}
                onClick={handleAction}
                disabled={saving || !!conflict.msg || ((modal === 'aprobar' || modal === 'reagendar') && (!form.vehiculo_id || !form.conductor_id))}
              >
                {saving ? <><span className="spinner spinner-sm" /> Guardando...</> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-secondary)', minWidth: 90, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

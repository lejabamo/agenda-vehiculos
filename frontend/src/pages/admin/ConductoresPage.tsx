import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getConductores, createConductor, updateConductor } from '../../services/api'

interface Conductor { id: number; nombre: string; telefono: string; activo: boolean }

export default function ConductoresPage() {
  const { token } = useAuth()
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState<Conductor | null>(null)
  const [form, setForm] = useState({ nombre: '', telefono: '', activo: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const load = () => token && getConductores(token).then(setConductores).catch(() => {})
  useEffect(() => { load() }, [token])

  const openForm = (c: Conductor | null = null) => {
    setSelected(c)
    setForm(c ? { nombre: c.nombre, telefono: c.telefono || '', activo: c.activo } : { nombre: '', telefono: '', activo: true })
    setError('')
    setModal(true)
  }

  const handleSave = async () => {
    if (!token) return
    setSaving(true); setError('')
    try {
      if (selected) {
        await updateConductor(token, selected.id, form)
      } else {
        await createConductor(token, form)
      }
      setModal(false); load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const filteredConductores = conductores.filter(c => showInactive || c.activo)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title" id="page-heading">Conductores</h1>
          <p className="page-subtitle">Personal conductor de la flota institucional</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Mostrar inactivos
          </label>
          <button className="btn btn-primary" onClick={() => openForm()} aria-label="Registrar un nuevo conductor">+ Nuevo Conductor</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table" aria-labelledby="page-heading">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Estado</th>
                <th scope="col" style={{ textAlign: 'center' }}><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredConductores.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.telefono || '—'}</td>
                  <td>
                    <span className={`badge ${c.activo ? 'badge-aprobado' : 'badge-cancelado'}`} aria-label={`Estado: ${c.activo ? 'Activo' : 'Inactivo'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => openForm(c)}
                      aria-label={`Editar conductor ${c.nombre}`}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {conductores.length === 0 && (
            <div className="empty-state" role="status">
              <div className="empty-state-icon" aria-hidden="true">👤</div>
              <p>No hay conductores registrados</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)} role="presentation">
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <span className="modal-title" id="modal-title">{selected ? 'Editar Conductor' : 'Nuevo Conductor'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)} aria-label="Cerrar modal">✕</button>
            </div>
            <div className="modal-body">
              <div aria-live="polite">
                {error && <div role="alert" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="conductor-nombre">Nombre completo <span className="required" aria-label="Requerido">*</span></label>
                <input id="conductor-nombre" className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del conductor" aria-required="true" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="conductor-tel">Teléfono</label>
                <input id="conductor-tel" className="form-input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="3XX XXX XXXX" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="activo" 
                  checked={form.activo} 
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} 
                />
                <label htmlFor="activo" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Conductor Activo</label>
              </div>

              {!form.nombre && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }} role="status">
                  El nombre es obligatorio para habilitar el guardado.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving || !form.nombre}
                aria-label={selected ? "Guardar cambios del conductor" : "Registrar nuevo conductor"}
              >
                {saving ? <span role="status">Guardando...</span> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

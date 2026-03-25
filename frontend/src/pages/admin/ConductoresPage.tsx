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
          <h1 className="page-title">Conductores</h1>
          <p className="page-subtitle">Personal conductor de la flota institucional</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Mostrar inactivos
          </label>
          <button className="btn btn-primary" onClick={() => openForm()}>+ Nuevo Conductor</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredConductores.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.telefono || '—'}</td>
                  <td>
                    <span className={`badge ${c.activo ? 'badge-aprobado' : 'badge-cancelado'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => openForm(c)}>✏️ Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {conductores.length === 0 && <div className="empty-state"><div className="empty-state-icon">👤</div><p>No hay conductores registrados</p></div>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selected ? 'Editar Conductor' : 'Nuevo Conductor'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
              <div className="form-group">
                <label className="form-label">Nombre completo <span className="required">*</span></label>
                <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del conductor" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="3XX XXX XXXX" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="activo" 
                  checked={form.activo} 
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} 
                />
                <label htmlFor="activo" className="form-label" style={{ marginBottom: 0 }}>Conductor Activo</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nombre}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getVehiculos, createVehiculo, updateVehiculo } from '../../services/api'

interface Vehiculo { id: number; placa: string; marca: string; modelo: string; anio: number; color: string; activo: boolean }

export default function VehiculosPage() {
  const { token } = useAuth()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ placa: '', marca: '', modelo: '', anio: '', color: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const load = () => token && getVehiculos(token).then(setVehiculos).catch(() => {})
  useEffect(() => { load() }, [token])

  const openNew = () => { setForm({ placa: '', marca: '', modelo: '', anio: '', color: '' }); setEditId(null); setModal(true) }

  const handleSave = async () => {
    if (!token) return
    setSaving(true); setError('')
    try {
      if (editId) {
        await updateVehiculo(token, editId, { ...form, anio: form.anio ? Number(form.anio) : null })
      } else {
        await createVehiculo(token, { ...form, anio: form.anio ? Number(form.anio) : null })
      }
      setModal(false); load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (v: Vehiculo) => {
    if (!token) return
    await updateVehiculo(token, v.id, { activo: !v.activo })
    load()
  }

  const filteredVehiculos = vehiculos.filter(v => showInactive || v.activo)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Vehículos</h1>
          <p className="page-subtitle">Gestión de la flota institucional</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Mostrar inactivos
          </label>
          <button className="btn btn-primary" onClick={openNew}>+ Nuevo Vehículo</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Placa</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Color</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filteredVehiculos.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.placa}</strong></td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.anio || '—'}</td>
                  <td>{v.color || '—'}</td>
                  <td>
                    <span className={`badge ${v.activo ? 'badge-aprobado' : 'badge-cancelado'}`}>
                      {v.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setForm({ placa: v.placa, marca: v.marca, modelo: v.modelo, anio: String(v.anio || ''), color: v.color || '' }); setEditId(v.id); setModal(true) }}>Editar</button>
                    <button className={`btn btn-sm ${v.activo ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleActivo(v)}>{v.activo ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehiculos.length === 0 && <div className="empty-state"><div className="empty-state-icon">🚗</div><p>No hay vehículos registrados</p></div>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">Placa <span className="required">*</span></label><input className="form-input" value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} placeholder="ABC123" /></div>
                <div className="form-group"><label className="form-label">Color</label><input className="form-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Blanco" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Marca <span className="required">*</span></label><input className="form-input" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Toyota" /></div>
                <div className="form-group"><label className="form-label">Modelo <span className="required">*</span></label><input className="form-input" value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Hilux" /></div>
              </div>
              <div className="form-group"><label className="form-label">Año</label><input type="number" className="form-input" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: e.target.value }))} placeholder="2022" min="2000" max="2030" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.placa || !form.marca || !form.modelo}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

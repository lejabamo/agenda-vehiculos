import { useState, useEffect } from 'react'
import { 
  getAdminDirectorioDependencias, createAdminDirectorioDependencia, updateAdminDirectorioDependencia, deleteAdminDirectorioDependencia,
  getAdminDirectorioLideres, createAdminDirectorioLider, updateAdminDirectorioLider, deleteAdminDirectorioLider
} from '../../services/api'

export default function DirectorioPage() {
  const token = localStorage.getItem('token') || ''
  const [tab, setTab] = useState<'lideres' | 'dependencias'>('lideres')
  const [deps, setDeps] = useState<any[]>([])
  const [lideres, setLideres] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [editingDep, setEditingDep] = useState<any>(null)
  const [editingLider, setEditingLider] = useState<any>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const d = await getAdminDirectorioDependencias(token)
      const l = await getAdminDirectorioLideres(token)
      if (Array.isArray(d)) setDeps(d)
      if (Array.isArray(l)) setLideres(l)
    } catch (e) {
      console.error('Error loading directorios:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDep = async (e: any) => {
    e.preventDefault()
    if (editingDep.id) {
      await updateAdminDirectorioDependencia(token, editingDep.id, editingDep)
    } else {
      await createAdminDirectorioDependencia(token, editingDep)
    }
    setEditingDep(null)
    load()
  }

  const handleDeleteDep = async (id: number) => {
    if (confirm('¿Eliminar esta dependencia? Tenga en cuenta que no debe tener líderes asociados.')) {
      try {
        const res = await deleteAdminDirectorioDependencia(token, id)
        if (res.detail) alert(res.detail)
        load()
      } catch (e) {
        alert('No se puede eliminar: compruebe que no existan líderes vinculados.')
      }
    }
  }

  const handleSaveLider = async (e: any) => {
    e.preventDefault()
    if (editingLider.id) {
      await updateAdminDirectorioLider(token, editingLider.id, editingLider)
    } else {
      await createAdminDirectorioLider(token, editingLider)
    }
    setEditingLider(null)
    load()
  }

  const handleDeleteLider = async (id: number) => {
    if (confirm('¿Eliminar este líder?')) {
      await deleteAdminDirectorioLider(token, id)
      load()
    }
  }

  return (
    <div className="admin-main">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Directorio de Contactos</h1>
        <p className="page-subtitle">Configure los líderes de dependencia y sus correos electrónicos para el auto-completado de solicitudes.</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tab-pills" style={{ background: '#e2e8f0', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setTab('lideres')}
            style={{ 
              padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: tab === 'lideres' ? 'white' : 'transparent',
              color: tab === 'lideres' ? 'var(--color-primary)' : '#64748b',
              boxShadow: tab === 'lideres' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            Líderes de Dependencia
          </button>
          <button 
            onClick={() => setTab('dependencias')}
            style={{ 
              padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: tab === 'dependencias' ? 'white' : 'transparent',
              color: tab === 'dependencias' ? 'var(--color-primary)' : '#64748b',
              boxShadow: tab === 'dependencias' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            Correos de Dependencia
          </button>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input 
            className="form-input" 
            placeholder={`Buscar en ${tab === 'lideres' ? 'líderes' : 'dependencias'}...`} 
            style={{ paddingLeft: '2.5rem', borderRadius: '10px', height: '42px', fontSize: '0.9rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {tab === 'lideres' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1.25rem' }}>
                <h3 style={{ margin: 0 }}>Listado de Líderes</h3>
                <button className="btn btn-primary" onClick={() => setEditingLider({ nombre: '', dependencia_id: deps[0]?.id })}>+ Agregar Líder</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Funcionario</th>
                    <th>Teléfono</th>
                    <th>Dependencia Asociada</th>
                    <th>Email Notificable</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lideres.filter(l => l.nombre.toLowerCase().includes(search.toLowerCase()) || l.dependencia.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No se encontraron líderes</td></tr>
                  ) : lideres.filter(l => l.nombre.toLowerCase().includes(search.toLowerCase()) || l.dependencia.toLowerCase().includes(search.toLowerCase())).map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{l.nombre}</td>
                      <td style={{ color: '#64748b' }}>{l.telefono || '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 500 }}>
                          {l.dependencia}
                        </span>
                      </td>
                      <td className="text-muted">{l.email || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={() => setEditingLider(l)} 
                            aria-label={`Editar información de ${l.nombre}`}
                          >
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>✏️</span>
                            <span className="sr-only">Editar</span>
                          </button>
                          <button 
                            className="btn btn-sm btn-ghost text-danger" 
                            onClick={() => handleDeleteLider(l.id)} 
                            aria-label={`Eliminar a ${l.nombre} del directorio`}
                          >
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>🗑️</span>
                            <span className="sr-only">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'dependencias' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Dependencias y Correos Institucionales</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>El correo configurado aquí es el que se auto-completa cuando se selecciona un líder.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setEditingDep({ nombre: '', email: '', prioridad: 0 })}>+ Nueva Dependencia</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre de la Dependencia</th>
                    <th>Correo Electrónico Oficial</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deps.filter(d => d.nombre.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No se encontraron dependencias</td></tr>
                  ) : deps.filter(d => d.nombre.toLowerCase().includes(search.toLowerCase())).map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{d.nombre}</td>
                      <td>
                        <span style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 500 }}>{d.email || <span style={{ color: 'var(--color-danger)' }}>Sin configurar</span>}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={() => setEditingDep(d)} 
                            aria-label={`Editar dependencia ${d.nombre}`}
                          >
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>✏️</span>
                            <span className="sr-only">Editar</span>
                          </button>
                          <button 
                            className="btn btn-sm btn-ghost text-danger" 
                            onClick={() => handleDeleteDep(d.id)} 
                            aria-label={`Eliminar dependencia ${d.nombre}`}
                          >
                            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>🗑️</span>
                            <span className="sr-only">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL LIDER */}
      {editingLider && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingLider.id ? 'Editar Líder' : 'Nuevo Líder'}</h3>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setEditingLider(null)}
                aria-label="Cerrar esta ventana"
              >
                Cerrar ✕
              </button>
            </div>
            <form onSubmit={handleSaveLider}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre Completo del Funcionario</label>
                  <input 
                    className="form-input" 
                    value={editingLider.nombre} 
                    onChange={e => setEditingLider({...editingLider, nombre: e.target.value})}
                    required
                    placeholder="Ej: Juan Perez"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input 
                    className="form-input" 
                    value={editingLider.telefono || ''} 
                    onChange={e => setEditingLider({...editingLider, telefono: e.target.value})}
                    placeholder="Ej: 310 000 0000"
                  />
                </div>
                <div className="form-group">
                  <label>Dependencia a la que Pertenece</label>
                  <select 
                    className="form-input" 
                    value={editingLider.dependencia_id} 
                    onChange={e => setEditingLider({...editingLider, dependencia_id: Number(e.target.value)})}
                    required
                  >
                    <option value="">Seleccione una dependencia...</option>
                    {deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                  <p className="form-hint">Esto determinará el correo electrónico que se mostrará al usuario.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingLider(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Líder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEP */}
      {editingDep && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingDep.id ? 'Editar Dependencia' : 'Nueva Dependencia'}</h3>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setEditingDep(null)}
                aria-label="Cerrar esta ventana"
              >
                Cerrar ✕
              </button>
            </div>
            <form onSubmit={handleSaveDep}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre de la Dependencia</label>
                  <input 
                    className="form-input" 
                    value={editingDep.nombre} 
                    onChange={e => setEditingDep({...editingDep, nombre: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico Institucional</label>
                  <input 
                    className="form-input" 
                    type="email"
                    value={editingDep.email || ''} 
                    onChange={e => setEditingDep({...editingDep, email: e.target.value})}
                    placeholder="correo@educacion.cauca.gov.co"
                    required
                  />
                  <p className="form-hint">Este correo se usará para notificar las solicitudes de los líderes de esta oficina.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingDep(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingDep.id ? 'Actualizar Datos' : 'Crear Dependencia'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

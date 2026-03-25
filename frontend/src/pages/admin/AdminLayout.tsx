import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../images/escudo.png'

const NAV = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/solicitudes', icon: '📋', label: 'Solicitudes' },
  { to: '/admin/calendario', icon: '📅', label: 'Calendario' },
  { to: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { to: '/admin/vehiculos', icon: '🚗', label: 'Vehículos' },
  { to: '/admin/conductores', icon: '👤', label: 'Conductores' },
  { to: '/admin/directorio', icon: '📞', label: 'Directorio' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/admin/login') }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-card">
            <img src={escudo} alt="GobCauca" />
            <div className="label">SECRETARÍA DE EDUCACIÓN Y CULTURA</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Menú Principal de Administración">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <span role="img" aria-hidden="true" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Usuario Actual</div>
             <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{user?.nombre}</div>
          </div>
          <button 
            className="btn btn-outline btn-full" 
            style={{ 
              borderColor: '#ef4444', color: '#ef4444', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontWeight: 700, borderRadius: '12px'
            }} 
            onClick={handleLogout}
            aria-label="Cerrar sesión del sistema"
          >
            <span aria-hidden="true">🚪</span> Salir del Sistema
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content" id="main-content">
        <header className="admin-topbar">
          <h2 className="sr-only">Barra de Herramientas</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
             Agenda Vehículos - Secretaría de Educación Gobernación del Cauca
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            {user?.nombre}
          </span>
        </header>
        <div className="admin-main">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

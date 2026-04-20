import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import escudo from '../../images/escudo.png'

const NAV = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard', key: 'd' },
  { to: '/admin/solicitudes', icon: '📋', label: 'Solicitudes', key: 's' },
  { to: '/admin/calendario', icon: '📅', label: 'Calendario', key: 'c' },
  { to: '/admin/analytics', icon: '📈', label: 'Analytics', key: 'a' },
  { to: '/admin/vehiculos', icon: '🚗', label: 'Vehículos', key: 'v' },
  { to: '/admin/conductores', icon: '👤', label: 'Conductores', key: 'u' },
  { to: '/admin/directorio', icon: '📞', label: 'Directorio', key: 'i' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Announce page changes to screen readers
  useEffect(() => {
    const announcer = document.getElementById('global-announcer')
    if (announcer) {
      const currentItem = NAV.find(item => location.pathname.startsWith(item.to))
      const pageTitle = currentItem ? currentItem.label : 'Página Administrativa'
      announcer.textContent = `Ha navegado a: ${pageTitle}`
    }
  }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/admin/login') }

  return (
    <div className="admin-layout">
      {/* Informative region for status updates */}
      <div className="sr-only" aria-live="polite" id="global-announcer"></div>

      {/* Skip to Content Link */}
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>

      {/* Sidebar */}
      <aside className="sidebar" role="complementary" aria-label="Navegación lateral">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-card">
            <img src={escudo} alt="Escudo de la Gobernación del Cauca" />
            <div className="label" aria-hidden="true">SECRETARÍA DE EDUCACIÓN Y CULTURA</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Menú Principal de Administración">
          <p className="sr-only">Puede usar Atajos: Alt + inicial del módulo (ej: Alt + S para Solicitudes)</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {NAV.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }: { isActive: boolean }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  aria-label={`${item.label} (Atajo: Alt más ${item.key})`}
                  accessKey={item.key}
                >
                  <span role="img" aria-hidden="true" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }} aria-hidden="true">Usuario Actual</div>
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
            accessKey="x"
          >
            <span aria-hidden="true">🚪</span> Salir del Sistema
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content" id="main-content" role="main" tabIndex={-1}>
        <header className="admin-topbar" role="banner">
          <h2 className="sr-only">Barra de estado superior</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
             Agenda Vehículos - Secretaría de Educación Gobernación del Cauca
          </span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }} aria-label={`Sesión activa de: ${user?.nombre}`}>
              {user?.nombre}
            </span>
          </div>
        </header>
        <div className="admin-main">
          <section aria-labelledby="page-heading">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  )
}

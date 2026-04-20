import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as apiLogin } from '../../services/api'
import escudo from '../../images/escudo.png'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiLogin(email, password)
      login(data.access_token, { nombre: data.nombre, email: data.email, role: data.role })
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f8fafc' }}>
      {/* Panel izquierdo institucional — DARK MODE PREMUM */}
      <div style={{
        background: '#1a1b26',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '3rem', color: 'white', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Logo Card */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          marginBottom: '2.5rem',
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={escudo} alt="Logo" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          Sistema de Agenda<br />de Vehículos SEDC
        </h1>
        <div style={{ width: '40px', height: '4px', background: '#3b82f6', margin: '1rem auto 1.5rem', borderRadius: '2px' }}></div>
        <p style={{ opacity: .6, fontSize: '1rem', maxWidth: '320px', lineHeight: 1.6, fontWeight: 400 }}>
          Plataforma centralizada para la gestión eficiente de solicitudes de vehículos institucionales y gubernamentales.
        </p>

        {/* Decorative elements */}
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }}></div>
      </div>

      {/* Panel derecho login */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Iniciar Sesión</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Ingrese sus credenciales administrativas</p>
          </div>

          <div aria-live="assertive" role="alert">
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fee2e2' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-email" className="form-label" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Usuario / Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} aria-hidden="true">@</span>
                 <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                  placeholder="correo@educacion.cauca.gov.co"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="login-password" className="form-label" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} aria-hidden="true">🔒</span>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full btn-lg" 
              disabled={loading} 
              style={{ height: '54px', borderRadius: '12px', background: '#0f172a', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}
              aria-label={loading ? "Iniciando sesión..." : "Ingresar al sistema administrativo"}
            >
              {loading ? <span role="status">Verificando...</span> : 'Ingresar al Sistema'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a href="#" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

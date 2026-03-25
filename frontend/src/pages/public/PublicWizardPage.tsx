import { useState } from 'react'
import Step1Reglamento from './steps/Step1Reglamento'
import Step2Desplazamiento from './steps/Step2Desplazamiento'
import Step3Comisionados from './steps/Step3Comisionados'
import Step4Contacto from './steps/Step4Contacto'
import Step5Confirmacion from './steps/Step5Confirmacion'
import { createSolicitud } from '../../services/api'
import escudo from '../../images/escudo.png'
import sedLogo from '../../images/sedcauca.jpg'

const STEPS = [
  'Reglamento',
  'Desplazamiento',
  'Comisionados',
  'Contacto',
  'Confirmación',
]

export interface FormData {
  acepta_condiciones: boolean
  dependencia_id: number | null
  dependencia_nombre: string
  objeto_desplazamiento: string
  fecha_salida: string
  fecha_regreso: string
  municipio_origen: string
  municipio_destino: string
  fuera_departamento: boolean
  lugar_destino_detalle: string
  comisionados: { nombre_completo: string; cargo: string; tipo_vinculacion: string }[]
  lider_dependencia: string
  email_respuesta: string
  telefono_contacto: string
}

const INITIAL: FormData = {
  acepta_condiciones: false,
  dependencia_id: null,
  dependencia_nombre: '',
  objeto_desplazamiento: '',
  fecha_salida: '',
  fecha_regreso: '',
  municipio_origen: 'Popayán',
  municipio_destino: '',
  fuera_departamento: false,
  lugar_destino_detalle: '',
  comisionados: [{ nombre_completo: '', cargo: '', tipo_vinculacion: 'PLANTA' }],
  lider_dependencia: '',
  email_respuesta: '',
  telefono_contacto: '',
}

export default function PublicWizardPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [solicitudId, setSolicitudId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const update = (partial: Partial<FormData>) => setForm(f => ({ ...f, ...partial }))

  const next = () => { setError(''); setStep(s => s + 1) }
  const prev = () => { setError(''); setStep(s => s - 1) }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const numDias = form.fecha_salida && form.fecha_regreso
        ? Math.max(1, Math.round((new Date(form.fecha_regreso).getTime() - new Date(form.fecha_salida).getTime()) / 86400000) + 1)
        : 1

      const payload = {
        dependencia_id: form.dependencia_id,
        objeto_desplazamiento: form.objeto_desplazamiento,
        fecha_salida: form.fecha_salida,
        fecha_regreso: form.fecha_regreso,
        num_dias: numDias,
        municipio_origen: form.municipio_origen,
        municipio_destino: form.municipio_destino,
        fuera_departamento: form.fuera_departamento,
        lugar_destino_detalle: form.lugar_destino_detalle,
        lider_dependencia: form.lider_dependencia,
        email_respuesta: form.email_respuesta,
        telefono_contacto: form.telefono_contacto,
        acepta_condiciones: form.acepta_condiciones,
        comisionados: form.comisionados,
      }
      const res = await createSolicitud(payload)
      setSolicitudId(res.id)
      setStep(5)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="institutional-ribbon"></div>
      
      {/* Navbar Institucional — Mismo estilo Auditorio */}
      <nav className="navbar" style={{ height: '70px', padding: '0 2rem' }}>
        <div className="navbar-brand-logos" style={{ gap: '0.75rem' }}>
          <img src={escudo} alt="Escudo Cauca" style={{ height: '40px' }} />
          <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }}></div>
          <img src={sedLogo} alt="Secretaría de Educación" style={{ height: '40px' }} />
        </div>
        
        <div className="navbar-titles" style={{ marginLeft: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gobernación del Cauca
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
            Sistema de Agenda de Vehículos SEDC
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Solicitud de Vehículo Institucional</h1>
      </div>

      {step < 5 && (
        <div className="wizard-container">
          {/* Indicador de pasos */}
          <div className="wizard-steps">
            {STEPS.map((label, i) => (
              <div key={i} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="wizard-step-num">{i < step ? '✓' : i + 1}</div>
                <div className="wizard-step-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="wizard-content">
            {error && (
              <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            {step === 0 && <Step1Reglamento form={form} update={update} onNext={next} />}
            {step === 1 && <Step2Desplazamiento form={form} update={update} onNext={next} onPrev={prev} />}
            {step === 2 && <Step3Comisionados form={form} update={update} onNext={next} onPrev={prev} />}
            {step === 3 && <Step4Contacto form={form} update={update} onNext={next} onPrev={prev} />}
            {step === 4 && <Step5Confirmacion form={form} onPrev={prev} onSubmit={submit} loading={loading} />}
          </div>
        </div>
      )}

      {step === 5 && solicitudId && (
        <div className="wizard-container">
          <div className="wizard-content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--color-success)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>¡Solicitud Enviada!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Su solicitud ha sido registrada exitosamente. Recibirá una notificación en <strong>{form.email_respuesta}</strong> cuando sea procesada.
            </p>
            <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', display: 'inline-block' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>CÓDIGO DE SEGUIMIENTO</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '4px' }}>#{String(solicitudId).padStart(5, '0')}</div>
            </div>
            <div>
              <button className="btn btn-outline" onClick={() => { setStep(0); setForm(INITIAL); setSolicitudId(null) }}>
                Nueva Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Institucional */}
      <footer style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', background: 'white', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          <img src={escudo} alt="" style={{ height: '30px' }} />
          <span>Gobernación del Cauca - Secretaría de Educación y Cultura</span>
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Calle 4 Carrera 7 Esquina, Edificio de la Gobernación, Popayán, Cauca.
        </p>
      </footer>
    </div>
  )
}

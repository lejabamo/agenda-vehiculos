import { FormData } from '../PublicWizardPage'

interface Props {
  form: FormData
  update: (p: Partial<FormData>) => void
  onNext: () => void
}

const REGLAS = [
  {
    titulo: 'Anticipación mínima',
    texto: 'Debe presentar la solicitud como mínimo el viernes de la semana anterior a la salida, antes de las 12:30 PM.',
  },
  {
    titulo: 'Sujeto a disponibilidad y prioridad',
    texto: 'La autorización puede quedar sin efecto si el vehículo es requerido para atender temas urgentes y/o prioritarios de la entidad.',
  },
  {
    titulo: 'Solo personal autorizado',
    texto: 'El uso del vehículo es exclusivo para funcionarios y contratistas debidamente contratados con acta de inicio firmada y orden de salida o comisión. Está prohibido transportar personal ajeno a la entidad.',
  },
  {
    titulo: 'Criterios de prioridad',
    texto: 'Se atenderán: agendas institucionales programadas por la Gobernación del Cauca o la Secretaría de Educación, hechos urgentes que requieran presencia de delegados, y actividades donde participen líderes de dependencia.',
  },
  {
    titulo: 'Coordinación con el conductor',
    texto: 'Una vez aprobada la solicitud, debe ponerse en contacto con el conductor asignado con suficiente antelación para coordinar la salida, cumpliendo estrictamente los horarios programados.',
  },
]

export default function Step1Reglamento({ form, update, onNext }: Props) {
  const canContinue = form.acepta_condiciones

  return (
    <>
      <h2 className="wizard-title">Reglamento de Uso del Vehículo</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Lea detenidamente las condiciones antes de realizar su solicitud.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {REGLAS.map((r, i) => (
          <div key={i} style={{ 
            background: 'white', 
            padding: '1.25rem', 
            borderRadius: '12px', 
            border: '1.5px solid #f1f5f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', 
                background: '#eff6ff', color: '#2563eb', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.9rem'
              }}>
                {i + 1}
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 800 }}>{r.titulo}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              {r.texto}
            </p>
          </div>
        ))}
      </div>

      {/* CONTACTO PARA NOVEDADES - AESTHETIC CARD (MOVido antes del checkbox) */}
      <div style={{
        marginTop: '2rem',
        padding: '1.25rem',
        background: '#f8faff',
        borderRadius: '12px',
        borderLeft: '4px solid var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          background: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          color: 'var(--color-accent)'
        }}>
          <span role="img" aria-label="Contacto">✉️</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>
            Novedades y Consultas
          </p>
          <p style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Dayra Milena Achicanoy Achicanoy
          </p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
            Profesional Universitario - Administrativa y Financiera
          </p>
          <a href="mailto:gestionadministrativa.educacion@cauca.gov.co" style={{ 
            color: 'var(--color-accent)', 
            textDecoration: 'none', 
            fontSize: '0.95rem', 
            fontWeight: 700,
            display: 'inline-block',
            marginTop: '0.25rem',
            borderBottom: '1.5px solid rgba(59,130,246,0.2)'
          }}>
            gestionadministrativa.educacion@cauca.gov.co
          </a>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: '14px', border: '1.5px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <label className="form-check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="checkbox"
            style={{ width: '22px', height: '22px', cursor: 'pointer' }}
            checked={form.acepta_condiciones}
            onChange={e => update({ acepta_condiciones: e.target.checked })}
          />
          <span className="form-check-label" style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            He leído y acepto las condiciones para el uso del vehículo institucional
          </span>
        </label>
      </div>

      <div className="wizard-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!canContinue}>
          Continuar →
        </button>
      </div>
    </>
  )
}

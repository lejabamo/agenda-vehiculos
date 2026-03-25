import { FormData } from '../PublicWizardPage'

interface Props {
  form: FormData
  onPrev: () => void
  onSubmit: () => void
  loading: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', width: '40%' }}>{label}</td>
      <td style={{ padding: '6px 12px', fontWeight: 600 }}>{value || '—'}</td>
    </tr>
  )
}

export default function Step5Confirmacion({ form, onPrev, onSubmit, loading }: Props) {
  const numDias = form.fecha_salida && form.fecha_regreso
    ? Math.max(1, Math.round((new Date(form.fecha_regreso).getTime() - new Date(form.fecha_salida).getTime()) / 86400000) + 1)
    : 0

  return (
    <>
      <h2 className="wizard-title">Resumen de la Solicitud</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Revise la información antes de enviar.</p>

      {/* Desplazamiento */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>📍 Desplazamiento</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              <Row label="Dependencia" value={form.dependencia_nombre} />
              <Row label="Objeto" value={form.objeto_desplazamiento} />
              <Row label="Fecha salida" value={form.fecha_salida} />
              <Row label="Fecha regreso" value={form.fecha_regreso} />
              <Row label="Duración" value={numDias ? `${numDias} día(s)` : ''} />
              <Row label="Origen" value={form.municipio_origen} />
              <Row label="Destino" value={form.municipio_destino + (form.fuera_departamento ? ' (fuera del Cauca)' : '')} />
              <Row label="Lugar específico" value={form.lugar_destino_detalle} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Comisionados */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>👥 Comisionados ({form.comisionados.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              {form.comisionados.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{i + 1}. {c.nombre_completo}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{c.cargo}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="badge badge-pendiente" style={{ fontSize: '0.7rem' }}>{c.tipo_vinculacion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contacto */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>📧 Contacto</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              <Row label="Líder dependencia" value={form.lider_dependencia} />
              <Row label="Correo" value={form.email_respuesta} />
              <Row label="Teléfono" value={form.telefono_contacto} />
            </tbody>
          </table>
        </div>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={onPrev} disabled={loading}>← Anterior</button>
        <button className="btn btn-primary btn-lg" onClick={onSubmit} disabled={loading}>
          {loading ? <><span className="spinner spinner-sm" /> Enviando...</> : '✓ Enviar Solicitud'}
        </button>
      </div>
    </>
  )
}

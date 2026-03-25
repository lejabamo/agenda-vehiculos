import { useState } from 'react'
import { FormData } from '../PublicWizardPage'
import Autocomplete from '../../../components/Autocomplete'
import { getLideres } from '../../../services/api'

interface Props {
  form: FormData
  update: (p: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function Step4Contacto({ form, update, onNext, onPrev }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.lider_dependencia.trim()) e.lider = 'Ingrese el nombre del líder'
    if (!form.email_respuesta.trim()) e.email = 'Ingrese el correo electrónico'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_respuesta)) e.email = 'Correo electrónico inválido'
    if (!form.telefono_contacto.trim()) e.tel = 'Ingrese el teléfono de contacto'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="wizard-content">
      <h2 className="step-title">Datos del Líder y Contacto</h2>
      <p className="step-description">
        Estos datos se usarán para notificarle sobre el estado de su solicitud.
      </p>

      <div className="form-group">
        <label>Nombres y apellidos del funcionario líder de dependencia *</label>
        <Autocomplete
          id="lider"
          value={form.lider_dependencia}
          onChange={v => update({ lider_dependencia: v })}
          onSelect={(item: any) => {
            update({ 
              lider_dependencia: item.nombre,
              dependencia_id: item.dependencia_id,
              email_respuesta: item.email || form.email_respuesta
            })
          }}
          fetch={getLideres}
          placeholder="Nombre completo del responsable de la solicitud"
          labelField="nombre"
        />
        {errors.lider && <span className="form-error">{errors.lider}</span>}
        <span className="form-hint">Basado en el manual de líderes y dependencias</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="email">Correo electrónico para respuesta <span className="required">*</span></label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="correo@educacion.cauca.gov.co"
            value={form.email_respuesta}
            onChange={e => update({ email_respuesta: e.target.value })}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
          <span className="form-hint">Recibirá notificaciones de aprobación o rechazo</span>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="telefono">Teléfono de contacto <span className="required">*</span></label>
          <input
            id="telefono"
            type="tel"
            className={`form-input ${errors.tel ? 'error' : ''}`}
            placeholder="3XX XXX XXXX"
            value={form.telefono_contacto}
            onChange={e => update({ telefono_contacto: e.target.value })}
          />
          {errors.tel && <span className="form-error">{errors.tel}</span>}
        </div>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={onPrev}>← Anterior</button>
        <button className="btn btn-primary btn-lg" onClick={() => { if (validate()) onNext() }}>Ver Resumen →</button>
      </div>
    </div>
  )
}

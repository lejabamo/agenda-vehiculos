import { useState } from 'react'
import { FormData } from '../PublicWizardPage'

interface Props {
  form: FormData
  update: (p: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

type Comisionado = FormData['comisionados'][0]

const CARGOS_PREDEFINIDOS = [
  { label: 'PE. Profesional Especializado', value: 'PE. Profesional Especializado', tipo: 'PLANTA' },
  { label: 'PU. Profesional Universitario', value: 'PU. Profesional Universitario', tipo: 'PLANTA' },
  { label: 'TA. Técnico Administrativo', value: 'TA. Técnico Administrativo', tipo: 'PLANTA' },
  { label: 'C. Contratista', value: 'C. Contratista', tipo: 'CONTRATISTA' },
  { label: 'Otro...', value: 'OTRO', tipo: 'OTRO' }
]

export default function Step3Comisionados({ form, update, onNext, onPrev }: Props) {
  const updateComisionado = (i: number, field: keyof Comisionado | 'any', val: string) => {
    const updated = form.comisionados.map((c, idx) => {
      if (idx !== i) return c
      
      const newObj = { ...c, [field]: val }
      
      // Lógica de auto-selección de vinculación según el cargo
      if (field === 'cargo') {
        const found = CARGOS_PREDEFINIDOS.find(cp => cp.value === val)
        if (found && found.tipo !== 'OTRO') {
          newObj.tipo_vinculacion = found.tipo
        }
      }
      
      return newObj
    })
    update({ comisionados: updated })
  }

  const addComisionado = () => {
    if (form.comisionados.length >= 4) return
    update({ comisionados: [...form.comisionados, { nombre_completo: '', cargo: '', tipo_vinculacion: 'PLANTA' }] })
  }

  const removeComisionado = (i: number) => {
    if (form.comisionados.length <= 1) return
    update({ comisionados: form.comisionados.filter((_, idx) => idx !== i) })
  }

  const isValid = form.comisionados.every(c => c.nombre_completo.trim() && c.cargo.trim())

  return (
    <>
      <h2 className="wizard-title">Comisionados</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        Registre los datos de cada persona que realizará el desplazamiento (máximo 4).
      </p>

      {form.comisionados.map((c, i) => (
        <div className="comisionado-card" key={i}>
          <div className="comisionado-header">
            <span className="comisionado-title">Comisionado {i + 1}</span>
            {form.comisionados.length > 1 && (
              <button className="btn btn-ghost btn-sm" onClick={() => removeComisionado(i)} style={{ color: 'var(--color-danger)' }}>
                ✕ Eliminar
              </button>
            )}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Nombres y apellidos completos <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="Nombre completo"
                value={c.nombre_completo}
                onChange={e => updateComisionado(i, 'nombre_completo', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Cargo <span className="required">*</span></label>
              <select 
                className="form-input"
                value={CARGOS_PREDEFINIDOS.some(cp => cp.value === c.cargo) ? c.cargo : 'OTRO'}
                onChange={e => {
                  const val = e.target.value
                  updateComisionado(i, 'cargo', val === 'OTRO' ? '' : val)
                }}
              >
                <option value="">Seleccione cargo...</option>
                {CARGOS_PREDEFINIDOS.map(cp => (
                  <option key={cp.value} value={cp.value}>{cp.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo extra si elige OTRO */}
          {!CARGOS_PREDEFINIDOS.filter(cp => cp.value !== 'OTRO').some(cp => cp.value === c.cargo) && c.cargo !== '' && (
             <div className="form-group" style={{ marginTop: '-10px', marginBottom: '15px' }}>
                <input
                  className="form-input"
                  placeholder="Especifique el cargo..."
                  value={c.cargo}
                  onChange={e => updateComisionado(i, 'cargo', e.target.value)}
                />
             </div>
          )}

          <div className="form-group">
            <label className="form-label">Tipo de vinculación <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {['PLANTA', 'CONTRATISTA', 'OTRO'].map(tipo => (
                <label className="form-check" key={tipo}>
                  <input
                    type="radio"
                    name={`tipo_vinculacion_${i}`}
                    value={tipo}
                    checked={c.tipo_vinculacion === tipo}
                    onChange={() => updateComisionado(i, 'tipo_vinculacion', tipo)}
                  />
                  <span className="form-check-label">{tipo === 'PLANTA' ? 'Planta' : tipo === 'CONTRATISTA' ? 'Contratista' : 'Otro'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}

      {form.comisionados.length < 4 && (
        <button className="btn btn-outline btn-sm" onClick={addComisionado} style={{ marginBottom: '1.5rem' }}>
          + Agregar Comisionado
        </button>
      )}

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={onPrev}>← Anterior</button>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!isValid}>Continuar →</button>
      </div>
    </>
  )
}

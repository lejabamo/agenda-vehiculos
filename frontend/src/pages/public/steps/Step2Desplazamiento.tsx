import { useState, useEffect } from 'react'
import { FormData } from '../PublicWizardPage'
import { getMunicipios, getDependencias, getDisponibilidad, getLideres, getInstituciones } from '../../../services/api'
import Autocomplete from '../../../components/Autocomplete'

interface Props {
  form: FormData
  update: (p: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

function Calendar({ onSelect, selectedStart, selectedEnd }: { onSelect: (d: string) => void, selectedStart: string, selectedEnd: string }) {
  const [disp, setDisp] = useState<Record<string, { ocupados: number; disponibles: number; estado: string }>>({})
  const [offset, setOffset] = useState(0) // offset en semanas
  
  const today = new Date()
  today.setHours(0,0,0,0)
  
  // Calcular el rango visible basado en el offset
  const viewStart = new Date(today)
  viewStart.setDate(today.getDate() + (offset * 7))
  
  const viewEnd = new Date(viewStart)
  viewEnd.setDate(viewStart.getDate() + 34)

  useEffect(() => {
    const s = viewStart.toISOString().split('T')[0]
    const e = viewEnd.toISOString().split('T')[0]
    getDisponibilidad(s, e).then(setDisp).catch(() => {})
  }, [offset])

  const days = []
  const startDayOfWeek = viewStart.getDay() 

  for (let i = 0; i < 35; i++) {
    const d = new Date(viewStart)
    d.setDate(viewStart.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const info = disp[iso] || { ocupados: 0, disponibles: 2, estado: 'DISPONIBLE' }
    days.push({ date: d, iso, info })
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setOffset(o => Math.max(0, o - 4))} 
          disabled={offset <= 0}
          title="Ver mes anterior"
        >
          ← Ant.
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>📅 Disponibilidad ({offset === 0 ? 'Actual' : `+${offset} semanas`})</span>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setOffset(o => o + 4)}
          title="Ver mes siguiente"
        >
          Sig. →
        </button>
      </div>
      <div className="calendar-grid">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(n => <div key={n} className="calendar-day-name">{n}</div>)}
        
        {/* Espacios vacíos para alinear el primer día */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}

        {days.map((d, i) => {
          const isSelected = d.iso === selectedStart || d.iso === selectedEnd || (selectedStart && selectedEnd && d.iso > selectedStart && d.iso < selectedEnd)
          const isFull = d.info.estado === 'AGOTADO'
          const isBusy = d.info.ocupados > 0 && !isFull
          const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6
          
          let statusClass = 'day-available'
          if (isFull) statusClass = 'day-full'
          else if (isBusy) statusClass = 'day-busy'
          else if (isWeekend) statusClass = 'day-holiday'

          return (
            <div
              key={i}
              className={`calendar-day ${statusClass} ${isSelected ? 'selected' : ''}`}
              title={`${d.info.ocupados} vehículos ocupados de ${d.info.ocupados + d.info.disponibles}`}
              onClick={() => !isFull && onSelect(d.iso)}
            >
              {d.date.getDate()}
            </div>
          )
        })}
      </div>
      <div className="calendar-indicators">
        <div className="indicator-item">
          <div className="indicator-box" style={{ background: 'var(--color-success-bg)', borderColor: '#c8e6c9' }} />
          <span>Disponible</span>
        </div>
        <div className="indicator-item">
          <div className="indicator-box" style={{ background: 'var(--color-warning-bg)', borderColor: '#FF6347' }} />
          <span>Comprometido (Tomate)</span>
        </div>
        <div className="indicator-item">
          <div className="indicator-box" style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }} />
          <span>Fin de semana</span>
        </div>
        <div className="indicator-item">
          <div className="indicator-box" style={{ background: 'var(--color-primary-dark)', borderColor: 'var(--color-primary-dark)' }} />
          <span>Ocupado (No disponible)</span>
        </div>
      </div>
    </div>
  )
}

export default function Step2Desplazamiento({ form, update, onNext, onPrev }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.dependencia_id) e.dependencia = 'Seleccione una dependencia'
    if (!form.objeto_desplazamiento.trim()) e.objeto = 'Ingrese el objeto del desplazamiento'
    if (!form.fecha_salida) e.fecha_salida = 'Seleccione fecha de salida'
    if (!form.fecha_regreso) e.fecha_regreso = 'Seleccione fecha de regreso'
    
    // Validar fecha y hora actual
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (form.fecha_salida === today) {
      if (now.getHours() >= 16) {
        e.fecha_salida = 'Para hoy, solo se permite antes de las 4 PM'
      }
    } else if (form.fecha_salida && form.fecha_salida < today) {
      e.fecha_salida = 'No puede seleccionar fechas pasadas'
    }

    if (form.fecha_salida && form.fecha_regreso && form.fecha_regreso < form.fecha_salida)
      e.fecha_regreso = 'La fecha de regreso debe ser igual o posterior a la salida'
    if (!form.municipio_destino.trim()) e.destino = 'Ingrese el municipio de destino'
    if (!form.lugar_destino_detalle.trim()) e.lugar = 'Especifique el lugar de destino'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) onNext() }

  const handleDateSelect = (iso: string) => {
    if (!form.fecha_salida || (form.fecha_salida && form.fecha_regreso)) {
      update({ fecha_salida: iso, fecha_regreso: '' })
    } else if (iso < form.fecha_salida) {
      update({ fecha_salida: iso, fecha_regreso: '' })
    } else {
      update({ fecha_regreso: iso })
    }
  }

  const numDias = form.fecha_salida && form.fecha_regreso
    ? Math.max(1, Math.round((new Date(form.fecha_regreso).getTime() - new Date(form.fecha_salida).getTime()) / 86400000) + 1)
    : 0

  return (
    <>
      <h2 className="wizard-title">Datos del Desplazamiento</h2>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="fecha_salida">Fecha de salida <span className="required">*</span></label>
          <input
            id="fecha_salida"
            type="date"
            className={`form-input ${errors.fecha_salida ? 'error' : ''}`}
            value={form.fecha_salida}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => update({ fecha_salida: e.target.value })}
          />
          {errors.fecha_salida && <span className="form-error">{errors.fecha_salida}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="fecha_regreso">Fecha de regreso <span className="required">*</span></label>
          <input
            id="fecha_regreso"
            type="date"
            className={`form-input ${errors.fecha_regreso ? 'error' : ''}`}
            value={form.fecha_regreso}
            min={form.fecha_salida || new Date().toISOString().split('T')[0]}
            onChange={e => update({ fecha_regreso: e.target.value })}
          />
          {errors.fecha_regreso && <span className="form-error">{errors.fecha_regreso}</span>}
        </div>
      </div>

      {numDias > 0 && (
        <div style={{ marginTop: '-0.75rem', marginBottom: '1.25rem', padding: '0.5rem 1rem', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-info)' }}>
          📅 <strong>Duración:</strong> {numDias} {numDias === 1 ? 'día' : 'días'}
        </div>
      )}

      {/* Calendario de Disponibilidad */}
      <Calendar onSelect={handleDateSelect} selectedStart={form.fecha_salida} selectedEnd={form.fecha_regreso} />

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-check">
          <input
            type="checkbox"
            checked={form.fuera_departamento}
            onChange={e => update({ fuera_departamento: e.target.checked, municipio_destino: '' })}
          />
          <span className="form-check-label">El destino es fuera del departamento del Cauca</span>
        </label>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="origen">Municipio origen <span className="required">*</span></label>
          <Autocomplete
            id="origen"
            value={form.municipio_origen}
            onChange={v => update({ municipio_origen: v })}
            onSelect={item => update({ municipio_origen: item.nombre })}
            fetch={getMunicipios}
            placeholder="Popayán"
          />
          {errors.origen && <span className="form-error">{errors.origen}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="destino">Municipio destino <span className="required">*</span></label>
          {!form.fuera_departamento ? (
            <Autocomplete
              id="destino"
              value={form.municipio_destino}
              onChange={v => update({ municipio_destino: v })}
              onSelect={item => update({ municipio_destino: item.nombre })}
              fetch={getMunicipios}
              placeholder="Buscar municipio del Cauca..."
            />
          ) : (
            <input
              id="destino"
              className={`form-input ${errors.destino ? 'error' : ''}`}
              placeholder="Municipio / ciudad de destino"
              value={form.municipio_destino}
              onChange={e => update({ municipio_destino: e.target.value })}
            />
          )}
          {errors.destino && <span className="form-error">{errors.destino}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="dependencia">Dependencia que realiza la solicitud <span className="required">*</span></label>
        <Autocomplete
          id="dependencia"
          value={form.dependencia_nombre}
          onChange={v => update({ dependencia_nombre: v, dependencia_id: null })}
          onSelect={item => {
            update({ dependencia_nombre: item.nombre, dependencia_id: item.id ?? null })
            if (item.id) {
              getLideres().then(lideres => {
                const lider = lideres.find((l: any) => l.dependencia_id === item.id)
                if (lider) {
                  update({
                    lider_dependencia: lider.nombre,
                    email_respuesta: form.email_respuesta || lider.email || ''
                  })
                }
              }).catch(() => {})
            }
          }}
          fetch={getDependencias}
          placeholder="Ej: Cobertura, UDAG, Calidad..."
        />
        {errors.dependencia && <span className="form-error">{errors.dependencia}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="objeto">Objeto del desplazamiento <span className="required">*</span></label>
        <textarea
          id="objeto"
          className={`form-textarea ${errors.objeto ? 'error' : ''}`}
          placeholder="Describa el motivo o actividad de la comisión"
          value={form.objeto_desplazamiento}
          onChange={e => update({ objeto_desplazamiento: e.target.value })}
          rows={3}
        />
        {errors.objeto && <span className="form-error">{errors.objeto}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="lugar_detalle">Especifique el lugar de destino <span className="required">*</span></label>
        <Autocomplete
          id="lugar_detalle"
          value={form.lugar_destino_detalle}
          onChange={v => update({ lugar_destino_detalle: v })}
          onSelect={item => update({ lugar_destino_detalle: item.nombre })}
          fetch={(v) => getInstituciones({ municipio: form.municipio_destino, q: v })}
          placeholder="Ej: Institución Educativa La Esperanza, Sede Municipal"
          className={errors.lugar ? 'error' : ''}
        />
        {errors.lugar && <span className="form-error">{errors.lugar}</span>}
      </div>

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={onPrev}>← Anterior</button>
        <button className="btn btn-primary btn-lg" onClick={handleNext}>Continuar →</button>
      </div>
    </>
  )
}

import { useState, useEffect, useRef } from 'react'


interface Props {
  value: string
  onChange: (v: string) => void
  onSelect: (item: any) => void
  fetch: (q: string) => Promise<any[]>
  placeholder: string
  id?: string
  labelField?: string
  className?: string
}

export default function Autocomplete({
  value, onChange, onSelect, fetch: fetchData, placeholder, id, labelField, className = ''
}: Props) {
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 1) { setItems([]); return }
    const t = setTimeout(async () => {
      const res = await fetchData(value)
      setItems(res)
      setOpen(res.length > 0)
    }, 250)
    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="autocomplete-wrapper" ref={ref}>
      <input
        id={id}
        className={`form-input ${className}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { if (items.length) setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="autocomplete-dropdown">
          {items.map((it, i) => (
            <div key={i} className="autocomplete-item" onMouseDown={() => { onSelect(it); setOpen(false) }}>
              {labelField ? it[labelField] : (it.nombre || it.name || it.titulo || it.label || (typeof it === 'string' ? it : JSON.stringify(it)))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

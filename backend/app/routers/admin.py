from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, timedelta
import io
import openpyxl

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.solicitud import Solicitud, EstadoSolicitud, Comisionado
from app.models.vehiculo import Vehiculo
from app.models.conductor import Conductor
from app.models.dependencia import Dependencia
from app.models.lider import Lider
from app.services.email_service import (
    send_aprobacion, send_rechazo, send_cancelacion, send_reagendamiento
)

router = APIRouter()


# ── Directorio Schemas ────────────────────────────────────────────────────────

class DependenciaUpdate(BaseModel):
    nombre: str
    email: Optional[str] = None
    prioridad: Optional[int] = None
    activo: Optional[bool] = None

class LiderBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None # Nuevo
    dependencia_id: int

class LiderCreate(LiderBase):
    pass

class LiderUpdate(LiderBase):
    pass


# ── Schemas ──────────────────────────────────────────────────────────────────

class AprobarRequest(BaseModel):
    vehiculo_id: int
    conductor_id: int
    observaciones: Optional[str] = None


class RechazarRequest(BaseModel):
    observaciones: str


class CancelarRequest(BaseModel):
    observaciones: Optional[str] = None


class ReagendarRequest(BaseModel):
    vehiculo_id: int
    conductor_id: int
    fecha_salida: date
    fecha_regreso: date
    observaciones: Optional[str] = None



# ── Listar solicitudes con filtros ────────────────────────────────────────────

@router.get("/solicitudes")
def list_solicitudes(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    dependencia_id: Optional[int] = None,
    estado: Optional[str] = None,
    vehiculo_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Solicitud).join(Dependencia)
    if desde:
        q = q.filter(Solicitud.fecha_salida >= desde)
    if hasta:
        q = q.filter(Solicitud.fecha_salida <= hasta)
    if dependencia_id:
        q = q.filter(Solicitud.dependencia_id == dependencia_id)
    if estado:
        q = q.filter(Solicitud.estado == estado)
    if vehiculo_id:
        q = q.filter(Solicitud.vehiculo_id == vehiculo_id)

    solicitudes = q.order_by(Solicitud.created_at.desc()).all()

    result = []
    for s in solicitudes:
        result.append({
            "id": s.id,
            "dependencia": s.dependencia.nombre if s.dependencia else "",
            "objeto_desplazamiento": s.objeto_desplazamiento,
            "fecha_salida": s.fecha_salida.isoformat(),
            "fecha_regreso": s.fecha_regreso.isoformat(),
            "num_dias": s.num_dias,
            "municipio_destino": s.municipio_destino,
            "fuera_departamento": s.fuera_departamento,
            "lider_dependencia": s.lider_dependencia,
            "email_respuesta": s.email_respuesta,
            "telefono_contacto": s.telefono_contacto,
            "estado": s.estado,
            "vehiculo": f"{s.vehiculo.placa} - {s.vehiculo.marca} {s.vehiculo.modelo}" if s.vehiculo else None,
            "conductor": s.conductor.nombre if s.conductor else None,
            "conductor_telefono": s.conductor.telefono if s.conductor else None,
            "comisionados": [
                {"nombre_completo": c.nombre_completo, "cargo": c.cargo, "tipo_vinculacion": c.tipo_vinculacion}
                for c in s.comisionados
            ],
            "observaciones_admin": s.observaciones_admin,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return result


# ── Detalle solicitud ─────────────────────────────────────────────────────────

@router.get("/solicitudes/{solicitud_id}")
def get_solicitud_admin(solicitud_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    return {
        "id": s.id,
        "dependencia_id": s.dependencia_id,
        "dependencia": s.dependencia.nombre if s.dependencia else "",
        "objeto_desplazamiento": s.objeto_desplazamiento,
        "fecha_salida": s.fecha_salida.isoformat(),
        "fecha_regreso": s.fecha_regreso.isoformat(),
        "num_dias": s.num_dias,
        "municipio_origen": s.municipio_origen,
        "municipio_destino": s.municipio_destino,
        "fuera_departamento": s.fuera_departamento,
        "lugar_destino_detalle": s.lugar_destino_detalle,
        "lider_dependencia": s.lider_dependencia,
        "email_respuesta": s.email_respuesta,
        "telefono_contacto": s.telefono_contacto,
        "estado": s.estado,
        "vehiculo_id": s.vehiculo_id,
        "vehiculo": {"placa": s.vehiculo.placa, "marca": s.vehiculo.marca, "modelo": s.vehiculo.modelo} if s.vehiculo else None,
        "conductor_id": s.conductor_id,
        "conductor": {"nombre": s.conductor.nombre, "telefono": s.conductor.telefono} if s.conductor else None,
        "comisionados": [
            {"id": c.id, "nombre_completo": c.nombre_completo, "cargo": c.cargo, "tipo_vinculacion": c.tipo_vinculacion}
            for c in s.comisionados
        ],
        "observaciones_admin": s.observaciones_admin,
        "reagendado_de_id": s.reagendado_de_id,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


# ── Aprobar ────────────────────────────────────────────────────────────────────

def _check_solapamiento(db: Session, vehiculo_id: int, conductor_id: int, fecha_salida: date, fecha_regreso: date, exclude_id: int = None):
    # Vehículo
    q_v = db.query(Solicitud).filter(
        Solicitud.vehiculo_id == vehiculo_id,
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= fecha_regreso,
        Solicitud.fecha_regreso >= fecha_salida,
    )
    if exclude_id:
        q_v = q_v.filter(Solicitud.id != exclude_id)
    v_conflicto = q_v.first()
    if v_conflicto:
        return f"El vehículo ya tiene una comisión aprobada del {v_conflicto.fecha_salida} al {v_conflicto.fecha_regreso} (Solicitud #{v_conflicto.id})"

    # Conductor
    q_c = db.query(Solicitud).filter(
        Solicitud.conductor_id == conductor_id,
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= fecha_regreso,
        Solicitud.fecha_regreso >= fecha_salida,
    )
    if exclude_id:
        q_c = q_c.filter(Solicitud.id != exclude_id)
    c_conflicto = q_c.first()
    if c_conflicto:
        return f"El conductor ya tiene una comisión aprobada del {c_conflicto.fecha_salida} al {c_conflicto.fecha_regreso} (Solicitud #{c_conflicto.id})"
    
    return None


@router.patch("/solicitudes/{solicitud_id}/aprobar")
def aprobar_solicitud(solicitud_id: int, data: AprobarRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado not in [EstadoSolicitud.PENDIENTE, EstadoSolicitud.REAGENDADO]:
        raise HTTPException(400, f"No se puede aprobar una solicitud en estado {s.estado}")

    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == data.vehiculo_id, Vehiculo.activo == True).first()
    if not vehiculo:
        raise HTTPException(404, "Vehículo no encontrado o inactivo")

    conductor = db.query(Conductor).filter(Conductor.id == data.conductor_id, Conductor.activo == True).first()
    if not conductor:
        raise HTTPException(404, "Conductor no encontrado o inactivo")

    # Validar solapamiento
    error_overlap = _check_solapamiento(db, data.vehiculo_id, data.conductor_id, s.fecha_salida, s.fecha_regreso, exclude_id=solicitud_id)
    if error_overlap:
        raise HTTPException(409, error_overlap)

    s.estado = EstadoSolicitud.APROBADO
    s.vehiculo_id = data.vehiculo_id
    s.conductor_id = data.conductor_id
    s.observaciones_admin = data.observaciones
    db.commit()
    db.refresh(s)

    try:
        send_aprobacion(s, vehiculo, conductor)
    except Exception:
        pass

    return {"ok": True, "estado": s.estado}


# ── Rechazar ──────────────────────────────────────────────────────────────────

@router.patch("/solicitudes/{solicitud_id}/rechazar")
def rechazar_solicitud(solicitud_id: int, data: RechazarRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado not in [EstadoSolicitud.PENDIENTE]:
        raise HTTPException(400, f"No se puede rechazar una solicitud en estado {s.estado}")

    s.estado = EstadoSolicitud.RECHAZADO
    s.observaciones_admin = data.observaciones
    db.commit()
    db.refresh(s)

    try:
        send_rechazo(s, data.observaciones)
    except Exception:
        pass

    return {"ok": True, "estado": s.estado}


# ── Cancelar ──────────────────────────────────────────────────────────────────

@router.patch("/solicitudes/{solicitud_id}/cancelar")
def cancelar_solicitud(solicitud_id: int, data: CancelarRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado == EstadoSolicitud.CANCELADO:
        raise HTTPException(400, "La solicitud ya está cancelada")

    s.estado = EstadoSolicitud.CANCELADO
    s.observaciones_admin = data.observaciones
    db.commit()
    db.refresh(s)

    try:
        send_cancelacion(s, data.observaciones or "")
    except Exception:
        pass

    return {"ok": True, "estado": s.estado}


# ── Finalizar (Liberar vehículo) ──────────────────────────────────────────────

@router.patch("/solicitudes/{solicitud_id}/finalizar")
def finalizar_solicitud(solicitud_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(404, "Solicitud no encontrada")
    if s.estado != EstadoSolicitud.APROBADO:
        raise HTTPException(400, "Solo se pueden finalizar solicitudes aprobadas")

    s.estado = EstadoSolicitud.FINALIZADA
    db.commit()
    db.refresh(s)
    return {"ok": True, "estado": s.estado}


# ── Reagendar ─────────────────────────────────────────────────────────────────

@router.patch("/solicitudes/{solicitud_id}/reagendar")
def reagendar_solicitud(solicitud_id: int, data: ReagendarRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    original = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not original:
        raise HTTPException(404, "Solicitud no encontrada")

    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == data.vehiculo_id, Vehiculo.activo == True).first()
    if not vehiculo:
        raise HTTPException(404, "Vehículo no encontrado")

    conductor = db.query(Conductor).filter(Conductor.id == data.conductor_id, Conductor.activo == True).first()
    if not conductor:
        raise HTTPException(404, "Conductor no encontrado")

    error_overlap = _check_solapamiento(db, data.vehiculo_id, data.conductor_id, data.fecha_salida, data.fecha_regreso, exclude_id=solicitud_id)
    if error_overlap:
        raise HTTPException(409, error_overlap)

    # Marcar original como REAGENDADO
    original.estado = EstadoSolicitud.REAGENDADO
    db.flush()

    num_dias = (data.fecha_regreso - data.fecha_salida).days + 1

    # Crear nueva solicitud ligada a la original
    nueva = Solicitud(
        dependencia_id=original.dependencia_id,
        objeto_desplazamiento=original.objeto_desplazamiento,
        fecha_salida=data.fecha_salida,
        fecha_regreso=data.fecha_regreso,
        num_dias=num_dias,
        municipio_origen=original.municipio_origen,
        municipio_destino=original.municipio_destino,
        fuera_departamento=original.fuera_departamento,
        lugar_destino_detalle=original.lugar_destino_detalle,
        lider_dependencia=original.lider_dependencia,
        email_respuesta=original.email_respuesta,
        telefono_contacto=original.telefono_contacto,
        vehiculo_id=data.vehiculo_id,
        conductor_id=data.conductor_id,
        estado=EstadoSolicitud.APROBADO,
        observaciones_admin=data.observaciones,
        reagendado_de_id=original.id,
    )
    db.add(nueva)
    db.flush()

    # Clonar comisionados
    for c in original.comisionados:
        db.add(Comisionado(
            solicitud_id=nueva.id,
            nombre_completo=c.nombre_completo,
            cargo=c.cargo,
            tipo_vinculacion=c.tipo_vinculacion,
        ))

    db.commit()
    db.refresh(nueva)

    try:
        send_reagendamiento(nueva, original, vehiculo, conductor)
    except Exception:
        pass

    return {"ok": True, "nueva_solicitud_id": nueva.id, "estado": nueva.estado}# ── Verificación de Cruces ───────────────────────────────────────────────────

@router.get("/verificar-cruce")
def verificar_cruce(
    vehiculo_id: int,
    conductor_id: int,
    desde: date,
    hasta: date,
    excluir_solicitud_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Verifica si un vehículo o conductor ya tienen comisiones aprobadas en el rango dado."""
    # Cruce Vehículo
    cruce_v = db.query(Solicitud).filter(
        Solicitud.vehiculo_id == vehiculo_id,
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= hasta,
        Solicitud.fecha_regreso >= desde,
    )
    if excluir_solicitud_id:
        cruce_v = cruce_v.filter(Solicitud.id != excluir_solicitud_id)
    
    v_conflicto = cruce_v.first()

    # Cruce Conductor
    cruce_c = db.query(Solicitud).filter(
        Solicitud.conductor_id == conductor_id,
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= hasta,
        Solicitud.fecha_regreso >= desde,
    )
    if excluir_solicitud_id:
        cruce_c = cruce_c.filter(Solicitud.id != excluir_solicitud_id)
        
    c_conflicto = cruce_c.first()

    return {
        "conflicto_vehiculo": {
            "id": v_conflicto.id,
            "desde": v_conflicto.fecha_salida.isoformat(),
            "hasta": v_conflicto.fecha_regreso.isoformat()
        } if v_conflicto else None,
        "conflicto_conductor": {
            "id": c_conflicto.id,
            "desde": c_conflicto.fecha_salida.isoformat(),
            "hasta": c_conflicto.fecha_regreso.isoformat()
        } if c_conflicto else None,
    }


@router.get("/disponibilidad-global")
def disponibilidad_global(
    desde: date,
    hasta: date,
    excluir_solicitud_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna un resumen de ocupación de la flota para un rango de fechas."""
    total_v = db.query(Vehiculo).filter(Vehiculo.activo == True).count()
    
    q_ocupados = db.query(Solicitud).filter(
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= hasta,
        Solicitud.fecha_regreso >= desde
    )
    if excluir_solicitud_id:
        q_ocupados = q_ocupados.filter(Solicitud.id != excluir_solicitud_id)
        
    ocupadas = q_ocupados.all()
    v_ids_ocupados = set([s.vehiculo_id for s in ocupadas if s.vehiculo_id])
    
    # Detalle de quiénes están ocupando
    detalles = []
    for s in ocupadas:
        detalles.append({
            "id": s.id,
            "dependencia": s.dependencia.nombre if s.dependencia else "N/A",
            "desde": s.fecha_salida.isoformat(),
            "hasta": s.fecha_regreso.isoformat()
        })

    return {
        "total_vehiculos_activos": total_v,
        "vehiculos_ocupados_count": len(v_ids_ocupados),
        "disponibles": max(0, total_v - len(v_ids_ocupados)),
        "solicitudes_conflicto": detalles
    }

@router.get("/dias-libres")
def dias_libres(
    vehiculo_id: int,
    desde: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna los próximos 5 días libres (sin comisión APROBADA) para el vehículo dado."""
    start = desde or date.today()
    ocupados = db.query(Solicitud).filter(
        Solicitud.vehiculo_id == vehiculo_id,
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_regreso >= start,
    ).all()

    rangos_ocupados = [(s.fecha_salida, s.fecha_regreso) for s in ocupados]

    libres = []
    current = start
    while len(libres) < 10:
        ocupado = any(inicio <= current <= fin for inicio, fin in rangos_ocupados)
        if not ocupado:
            libres.append(current.isoformat())
        current += timedelta(days=1)

    return {"vehiculo_id": vehiculo_id, "dias_libres": libres}


# ── Calendario ────────────────────────────────────────────────────────────────

@router.get("/calendario")
def calendario(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    start = desde or date.today().replace(day=1)
    end = hasta or (start + timedelta(days=60))

    solicitudes = db.query(Solicitud).filter(
        Solicitud.fecha_salida <= end,
        Solicitud.fecha_regreso >= start,
        Solicitud.estado.in_([EstadoSolicitud.APROBADO, EstadoSolicitud.PENDIENTE]),
    ).all()

    return [
        {
            "id": s.id,
            "title": f"{s.dependencia.nombre} → {s.municipio_destino}",
            "start": s.fecha_salida.isoformat(),
            "end": s.fecha_regreso.isoformat(),
            "estado": s.estado,
            "vehiculo": s.vehiculo.placa if s.vehiculo else "Sin asignar",
            "conductor": s.conductor.nombre if s.conductor else "Sin asignar",
        }
        for s in solicitudes
    ]


# ── Exportar Excel ────────────────────────────────────────────────────────────

@router.get("/export")
def export_excel(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Solicitud).join(Dependencia)
    if desde:
        q = q.filter(Solicitud.fecha_salida >= desde)
    if hasta:
        q = q.filter(Solicitud.fecha_salida <= hasta)
    if estado:
        q = q.filter(Solicitud.estado == estado)
    solicitudes = q.order_by(Solicitud.fecha_salida).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Solicitudes Vehículos"

    headers = [
        "ID", "Dependencia", "Objeto", "Fecha Salida", "Fecha Regreso",
        "Días", "Municipio Destino", "Fuera Dpto", "Líder", "Email", "Teléfono",
        "Estado", "Vehículo", "Conductor", "Comisionados", "Obs. Admin",
    ]
    ws.append(headers)

    for s in solicitudes:
        comisionados_str = " | ".join(
            f"{c.nombre_completo} ({c.cargo}, {c.tipo_vinculacion})" for c in s.comisionados
        )
        ws.append([
            s.id, s.dependencia.nombre if s.dependencia else "",
            s.objeto_desplazamiento,
            s.fecha_salida.isoformat(), s.fecha_regreso.isoformat(), s.num_dias,
            s.municipio_destino, "Sí" if s.fuera_departamento else "No",
            s.lider_dependencia, s.email_respuesta, s.telefono_contacto,
            s.estado,
            f"{s.vehiculo.placa} {s.vehiculo.marca}" if s.vehiculo else "",
            s.conductor.nombre if s.conductor else "",
            comisionados_str, s.observaciones_admin or "",
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=solicitudes_vehiculos.xlsx"},
    )


# ── Directorio (Master Data) ──────────────────────────────────────────────────

@router.get("/directorio/dependencias", response_model=List[dict])
def list_dependencias_directorio(db: Session = Depends(get_db), _=Depends(get_current_user)):
    deps = db.query(Dependencia).order_by(Dependencia.prioridad).all()
    return [{
        "id": d.id,
        "nombre": d.nombre,
        "email": d.email,
        "prioridad": d.prioridad,
        "activo": d.activo
    } for d in deps]

@router.post("/directorio/dependencias")
def create_dependencia_directorio(data: DependenciaUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    # DependenciaUpdate tiene los mismos campos que necesitamos para crear
    nueva = Dependencia(nombre=data.nombre, email=data.email, prioridad=data.prioridad or 0, activo=True)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id": nueva.id}

@router.put("/directorio/dependencias/{dep_id}")
def update_dependencia_directorio(dep_id: int, data: DependenciaUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dep = db.query(Dependencia).filter(Dependencia.id == dep_id).first()
    if not dep:
        raise HTTPException(404, "Dependencia no encontrada")
    dep.nombre = data.nombre
    dep.email = data.email
    if data.prioridad is not None: dep.prioridad = data.prioridad
    if data.activo is not None: dep.activo = data.activo
    db.commit()
    return {"ok": True}

@router.delete("/directorio/dependencias/{dep_id}")
def delete_dependencia_directorio(dep_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dep = db.query(Dependencia).filter(Dependencia.id == dep_id).first()
    if not dep:
        raise HTTPException(404, "Dependencia no encontrada")
    # Verificar si tiene líderes asociados
    if db.query(Lider).filter(Lider.dependencia_id == dep_id).count() > 0:
        raise HTTPException(400, "No se puede eliminar una dependencia que tiene líderes asociados")
    db.delete(dep)
    db.commit()
    return {"ok": True}

@router.get("/directorio/lideres", response_model=List[dict])
def list_lideres_directorio(db: Session = Depends(get_db), _=Depends(get_current_user)):
    lideres = db.query(Lider).all()
    return [{
        "id": l.id,
        "nombre": l.nombre,
        "telefono": l.telefono, # Nuevo
        "dependencia_id": l.dependencia_id,
        "dependencia": l.dependencia.nombre if l.dependencia else "",
        "email": l.dependencia.email if l.dependencia else ""
    } for l in lideres]

@router.post("/directorio/lideres")
def create_lider_directorio(data: LiderCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    nuevo = Lider(nombre=data.nombre, telefono=data.telefono, dependencia_id=data.dependencia_id)
    db.add(nuevo)
    db.commit()
    return {"id": nuevo.id}

@router.put("/directorio/lideres/{lider_id}")
def update_lider_directorio(lider_id: int, data: LiderUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lider = db.query(Lider).filter(Lider.id == lider_id).first()
    if not lider:
        raise HTTPException(404, "Líder no encontrado")
    lider.nombre = data.nombre
    lider.telefono = data.telefono # Nuevo
    lider.dependencia_id = data.dependencia_id
    db.commit()
    return {"ok": True}

@router.delete("/directorio/lideres/{lider_id}")
def delete_lider_directorio(lider_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lider = db.query(Lider).filter(Lider.id == lider_id).first()
    if not lider:
        raise HTTPException(404, "Líder no encontrado")
    db.delete(lider)
    db.commit()
    return {"ok": True}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import date
import os
from sqlalchemy import func
from app.core.database import get_db
from app.models.solicitud import Solicitud, Comisionado, EstadoSolicitud, TipoVinculacion
from app.models.lider import Lider
from app.models.dependencia import Dependencia
from app.services.email_service import send_solicitud_received, send_notification

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class ComisionadoIn(BaseModel):
    nombre_completo: str
    cargo: str
    tipo_vinculacion: TipoVinculacion


class SolicitudCreate(BaseModel):
    dependencia_id: int
    objeto_desplazamiento: str
    fecha_salida: date
    fecha_regreso: date
    municipio_origen: str = "Popayán"
    municipio_destino: str
    fuera_departamento: bool = False
    lugar_destino_detalle: str
    lider_dependencia: str
    email_respuesta: str
    telefono_contacto: str
    comisionados: List[ComisionadoIn]
    acepta_condiciones: bool


class ComisionadoOut(BaseModel):
    id: int
    nombre_completo: str
    cargo: str
    tipo_vinculacion: str

    class Config:
        from_attributes = True


class SolicitudOut(BaseModel):
    id: int
    dependencia_id: int
    objeto_desplazamiento: str
    fecha_salida: date
    fecha_regreso: date
    num_dias: int
    municipio_origen: str
    municipio_destino: str
    fuera_departamento: bool
    lugar_destino_detalle: str
    lider_dependencia: str
    email_respuesta: str
    telefono_contacto: str
    estado: str
    comisionados: List[ComisionadoOut]

    class Config:
        from_attributes = True


# ── Endpoints públicos ────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def crear_solicitud(data: SolicitudCreate, db: Session = Depends(get_db)):
    if not data.acepta_condiciones:
        raise HTTPException(400, "Debe aceptar las condiciones de uso del vehículo")
    if len(data.comisionados) == 0:
        raise HTTPException(400, "Debe registrar al menos un comisionado")
    if len(data.comisionados) > 4:
        raise HTTPException(400, "Máximo 4 comisionados por solicitud")
    if data.fecha_regreso < data.fecha_salida:
        raise HTTPException(400, "La fecha de regreso debe ser igual o posterior a la de salida")

    # Validar dependencia
    dep = db.query(Dependencia).filter(Dependencia.id == data.dependencia_id).first()
    if not dep:
        raise HTTPException(404, "Dependencia no encontrada")

    num_dias = (data.fecha_regreso - data.fecha_salida).days + 1

    solicitud = Solicitud(
        dependencia_id=data.dependencia_id,
        objeto_desplazamiento=data.objeto_desplazamiento,
        fecha_salida=data.fecha_salida,
        fecha_regreso=data.fecha_regreso,
        num_dias=num_dias,
        municipio_origen=data.municipio_origen,
        municipio_destino=data.municipio_destino,
        fuera_departamento=data.fuera_departamento,
        lugar_destino_detalle=data.lugar_destino_detalle,
        lider_dependencia=data.lider_dependencia,
        email_respuesta=data.email_respuesta,
        telefono_contacto=data.telefono_contacto,
        estado=EstadoSolicitud.PENDIENTE,
    )
    db.add(solicitud)
    db.flush()  # get id

    for c in data.comisionados:
        db.add(Comisionado(
            solicitud_id=solicitud.id,
            nombre_completo=c.nombre_completo,
            cargo=c.cargo,
            tipo_vinculacion=c.tipo_vinculacion,
        ))

    db.commit()
    db.refresh(solicitud)

    # Email de confirmación al solicitante
    try:
        send_solicitud_received(solicitud, dep.nombre)
    except Exception:
        pass  # No bloquear por fallo de email

    return {"id": solicitud.id, "estado": solicitud.estado, "message": "Solicitud recibida exitosamente"}


@router.get("/lideres")
def get_lideres(db: Session = Depends(get_db)):
    """Retorna la lista de líderes y sus dependencias (incluyendo email) desde la BD."""
    lideres = db.query(Lider).all()
    res = []
    for l in lideres:
        res.append({
            "id": l.id,
            "nombre": l.nombre,
            "dependencia_id": l.dependencia_id,
            "dependencia": l.dependencia.nombre,
            "email": l.dependencia.email
        })
    return res


@router.get("/disponibilidad")
def get_disponibilidad(desde: date, hasta: date, db: Session = Depends(get_db)):
    """Retorna un diccionario de {fecha: ocupacion} para el rango dado baseado na flota real."""
    total_v = db.query(Vehiculo).filter(Vehiculo.activo == True).count()
    if total_v == 0:
        total_v = 2 # fallback
        
    ocupados = db.query(
        Solicitud.fecha_salida,
        Solicitud.fecha_regreso
    ).filter(
        Solicitud.estado.in_([EstadoSolicitud.APROBADO, EstadoSolicitud.FINALIZADA]),
        Solicitud.fecha_salida <= hasta,
        Solicitud.fecha_regreso >= desde
    ).all()

    # Calcular ocupacion por dia
    from datetime import timedelta
    res = {}
    curr = desde
    
    while curr <= hasta:
        count = 0
        for s_start, s_end in ocupados:
            if s_start <= curr <= s_end:
                count += 1
        res[curr.isoformat()] = {
            "ocupados": count,
            "disponibles": max(0, total_v - count),
            "estado": "AGOTADO" if count >= total_v else "DISPONIBLE"
        }
        curr += timedelta(days=1)
    
    return res


@router.get("/{solicitud_id}", response_model=SolicitudOut)
def get_solicitud(solicitud_id: int, db: Session = Depends(get_db)):
    sol = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not sol:
        raise HTTPException(404, "Solicitud no encontrada")
    return sol

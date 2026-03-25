from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.solicitud import Solicitud, EstadoSolicitud
from app.models.dependencia import Dependencia

router = APIRouter()


@router.get("/municipios")
def analytics_municipios(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    limit: int = Query(default=15, le=50),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Ranking de municipios de destino más visitados."""
    q = db.query(
        Solicitud.municipio_destino,
        func.count(Solicitud.id).label("total"),
    ).filter(Solicitud.estado == EstadoSolicitud.APROBADO)
    if desde:
        q = q.filter(Solicitud.fecha_salida >= desde)
    if hasta:
        q = q.filter(Solicitud.fecha_salida <= hasta)
    return q.group_by(Solicitud.municipio_destino).order_by(desc("total")).limit(limit).all()


@router.get("/instituciones")
def analytics_instituciones(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    limit: int = Query(default=15, le=50),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Ranking de objetos/instituciones más frecuentes en las comisiones."""
    q = db.query(
        Solicitud.objeto_desplazamiento,
        func.count(Solicitud.id).label("total"),
    ).filter(Solicitud.estado == EstadoSolicitud.APROBADO)
    if desde:
        q = q.filter(Solicitud.fecha_salida >= desde)
    if hasta:
        q = q.filter(Solicitud.fecha_salida <= hasta)
    return q.group_by(Solicitud.objeto_desplazamiento).order_by(desc("total")).limit(limit).all()


@router.get("/dependencias")
def analytics_dependencias(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Solicitudes totales por dependencia."""
    q = db.query(
        Dependencia.nombre,
        func.count(Solicitud.id).label("total"),
    ).join(Solicitud, Solicitud.dependencia_id == Dependencia.id)
    if desde:
        q = q.filter(Solicitud.fecha_salida >= desde)
    if hasta:
        q = q.filter(Solicitud.fecha_salida <= hasta)
    return q.group_by(Dependencia.nombre).order_by(desc("total")).all()


@router.get("/resumen")
def analytics_resumen(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Dashboard: métricas rápidas del día y semana actual."""
    hoy = date.today()
    pendientes = db.query(func.count(Solicitud.id)).filter(Solicitud.estado == EstadoSolicitud.PENDIENTE).scalar()
    en_campo_hoy = db.query(func.count(Solicitud.id)).filter(
        Solicitud.estado == EstadoSolicitud.APROBADO,
        Solicitud.fecha_salida <= hoy,
        Solicitud.fecha_regreso >= hoy,
    ).scalar()
    total_mes = db.query(func.count(Solicitud.id)).filter(
        func.extract("month", Solicitud.fecha_salida) == hoy.month,
        func.extract("year", Solicitud.fecha_salida) == hoy.year,
    ).scalar()

    return {
        "pendientes": pendientes,
        "en_campo_hoy": en_campo_hoy,
        "total_mes": total_mes,
    }

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, String
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
    try:
        q = db.query(
            Solicitud.municipio_destino,
            func.count(Solicitud.id).label("total"),
        )
        # Filtro simplificado para debug
        if desde:
            q = q.filter(Solicitud.fecha_salida >= desde)
        return q.group_by(Solicitud.municipio_destino).order_by(desc("total")).limit(limit).all()
    except Exception as e:
        return [{"municipio_destino": f"Error: {str(e)}", "total": 0}]


@router.get("/instituciones")
def analytics_instituciones(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    limit: int = Query(default=15, le=50),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Ranking de objetos/instituciones más frecuentes en las comisiones."""
    try:
        q = db.query(
            Solicitud.objeto_desplazamiento,
            func.count(Solicitud.id).label("total"),
        )
        return q.group_by(Solicitud.objeto_desplazamiento).order_by(desc("total")).limit(limit).all()
    except Exception as e:
        return [{"objeto_desplazamiento": f"Error: {str(e)}", "total": 0}]


@router.get("/dependencias")
def analytics_dependencias(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Solicitudes totales por dependencia."""
    try:
        q = db.query(
            Dependencia.nombre,
            func.count(Solicitud.id).label("total"),
        ).join(Solicitud, Solicitud.dependencia_id == Dependencia.id)
        return q.group_by(Dependencia.nombre).order_by(desc("total")).all()
    except Exception as e:
        return [{"nombre": f"Error: {str(e)}", "total": 0}]


@router.get("/resumen")
def analytics_resumen(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Dashboard: métricas rápidas del día y semana actual."""
    try:
        hoy = date.today()
        pendientes = db.query(func.count(Solicitud.id)).filter(Solicitud.estado.cast(String) == "PENDIENTE").scalar()
        total_total = db.query(func.count(Solicitud.id)).scalar()

        return {
            "pendientes": pendientes,
            "en_campo_hoy": 0,
            "total_mes": total_total, # Usamos total absoluto para verificar conexión
            "debug": "ok"
        }
    except Exception as e:
        return {"error": str(e)}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.models.solicitud import Solicitud
from app.models.dependencia import Dependencia

router = APIRouter()

@router.get("/municipios")
def analytics_municipios(db: Session = Depends(get_db)):
    """Simple count by municipality."""
    return db.query(
        Solicitud.municipio_destino, 
        func.count(Solicitud.id).label("total")
    ).group_by(Solicitud.municipio_destino).all()

@router.get("/instituciones")
def analytics_instituciones(db: Session = Depends(get_db)):
    """Simple count by institution."""
    return db.query(
        Solicitud.objeto_desplazamiento, 
        func.count(Solicitud.id).label("total")
    ).group_by(Solicitud.objeto_desplazamiento).all()

@router.get("/dependencias")
def analytics_dependencias(db: Session = Depends(get_db)):
    """Simple count by dependency."""
    return db.query(
        Dependencia.nombre, 
        func.count(Solicitud.id).label("total")
    ).join(Solicitud, Solicitud.dependencia_id == Dependencia.id).group_by(Dependencia.nombre).all()

@router.get("/resumen")
def analytics_resumen(db: Session = Depends(get_db)):
    """Basic summary."""
    return {
        "pendientes": db.query(func.count(Solicitud.id)).scalar(),
        "en_campo_hoy": 0,
        "total_mes": db.query(func.count(Solicitud.id)).scalar(),
        "status": "online"
    }

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
    results = db.query(
        Solicitud.municipio_destino, 
        func.count(Solicitud.id).label("total")
    ).group_by(Solicitud.municipio_destino).all()
    return [{"municipio_destino": r[0], "total": r[1]} for r in results]

@router.get("/instituciones")
def analytics_instituciones(db: Session = Depends(get_db)):
    """Simple count by institution."""
    results = db.query(
        Solicitud.objeto_desplazamiento, 
        func.count(Solicitud.id).label("total")
    ).group_by(Solicitud.objeto_desplazamiento).all()
    return [{"objeto_desplazamiento": r[0], "total": r[1]} for r in results]

@router.get("/dependencias")
def analytics_dependencias(db: Session = Depends(get_db)):
    """Simple count by dependency."""
    try:
        results = db.query(
            Dependencia.nombre, 
            func.count(Solicitud.id).label("total")
        ).join(Solicitud, Solicitud.dependencia_id == Dependencia.id).group_by(Dependencia.nombre).all()
        return [{"nombre": r[0], "total": r[1]} for r in results]
    except Exception as e:
        return [{"nombre": f"Error DB: {str(e)}", "total": 0}]

@router.get("/resumen")
def analytics_resumen(db: Session = Depends(get_db)):
    """Basic summary."""
    try:
        count = db.query(func.count(Solicitud.id)).scalar() or 0
        return {
            "pendientes": count,
            "en_campo_hoy": 0,
            "total_mes": count,
            "status": "online"
        }
    except Exception as e:
        return {"error": str(e)}

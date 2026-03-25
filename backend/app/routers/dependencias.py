from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.dependencia import Dependencia

router = APIRouter()


@router.get("/")
def list_dependencias(q: str = Query(default="", max_length=100), db: Session = Depends(get_db)):
    """Autocompletado de dependencias SEDC, priorizadas por recurrencia."""
    query = db.query(Dependencia).filter(Dependencia.activo == True)
    if q:
        query = query.filter(Dependencia.nombre.ilike(f"%{q}%"))
    return query.order_by(Dependencia.prioridad, Dependencia.nombre).limit(20).all()

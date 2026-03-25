from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.municipio import Municipio

router = APIRouter()


@router.get("/")
def list_municipios(q: str = Query(default="", max_length=100), db: Session = Depends(get_db)):
    """Autocompletado de municipios del Cauca. Retorna hasta 20 resultados."""
    query = db.query(Municipio).filter(Municipio.es_cauca == True)
    if q:
        query = query.filter(Municipio.nombre.ilike(f"%{q}%"))
    return query.order_by(Municipio.nombre).limit(20).all()

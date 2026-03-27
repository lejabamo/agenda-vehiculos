from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.institucion_educativa import InstitucionEducativa

router = APIRouter()

@router.get("/")
def search_instituciones(
    municipio_id: int = Query(None, description="Filtrar por ID de municipio"),
    q: str = Query(default="", max_length=100, description="Buscar por nombre o DANE"),
    db: Session = Depends(get_db)
):
    """Búsqueda autocompletada de instituciones educativas, opcionalmente filtrada por municipio."""
    query = db.query(InstitucionEducativa)
    
    if municipio_id:
        query = query.filter(InstitucionEducativa.municipio_id == municipio_id)
        
    if q:
        query = query.filter(
            (InstitucionEducativa.nombre.ilike(f"%{q}%")) |
            (InstitucionEducativa.codigo_dane.ilike(f"%{q}%"))
        )
        
    return query.order_by(InstitucionEducativa.nombre).limit(30).all()

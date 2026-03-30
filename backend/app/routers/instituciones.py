from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.institucion_educativa import InstitucionEducativa

router = APIRouter()

@router.get("/")
def search_instituciones(
    municipio_id: int = Query(None, description="Filtrar por ID de municipio"),
    municipio: str = Query(None, description="Filtrar por nombre de municipio"),
    q: str = Query(default="", max_length=100, description="Buscar por nombre o DANE"),
    db: Session = Depends(get_db)
):
    """Búsqueda de instituciones educativas, filtrada por nombre o ID de municipio."""
    from app.models.municipio import Municipio
    query = db.query(InstitucionEducativa)
    
    if municipio_id:
        query = query.filter(InstitucionEducativa.municipio_id == municipio_id)
    elif municipio:
        # Buscar el ID del municipio por su nombre (insensible a mayúsculas)
        m = db.query(Municipio).filter(Municipio.nombre.ilike(municipio)).first()
        if m:
            query = query.filter(InstitucionEducativa.municipio_id == m.id)
        else:
            return [] # Si el municipio no existe, no hay colegios que mostrar
         
    if q:
        query = query.filter(
            (InstitucionEducativa.nombre.ilike(f"%{q}%")) |
            (InstitucionEducativa.codigo_dane.ilike(f"%{q}%"))
        )
        
    return query.order_by(InstitucionEducativa.nombre).limit(30).all()

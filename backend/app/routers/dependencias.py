from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.dependencia import Dependencia

router = APIRouter()

ALIASES = {
    "udag": "Apoyo a la Gestión",
    "sac": "Atención al Ciudadano",
    "tic": "Informáticos",
    "sistemas": "Informáticos",
    "sst": "Salud en el Trabajo",
    "talento": "Talento Humano",
    "nomina": "Nómina",
    "rh": "Talento",
    "rrhh": "Talento"
}

@router.get("/")
def list_dependencias(q: str = Query(default="", max_length=100), db: Session = Depends(get_db)):
    """Autocompletado de dependencias SEDC, priorizadas por recurrencia."""
    query = db.query(Dependencia).filter(Dependencia.activo == True)
    if q:
        q_lower = q.lower().strip()
        search_term = ALIASES.get(q_lower, q)
        query = query.filter(Dependencia.nombre.ilike(f"%{search_term}%"))
    return query.order_by(Dependencia.prioridad, Dependencia.nombre).limit(20).all()

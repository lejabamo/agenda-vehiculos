from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.dependencia import Dependencia
from app.models.lider import Lider

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class DependenciaUpdate(BaseModel):
    nombre: str
    email: Optional[str] = None
    prioridad: Optional[int] = None
    activo: Optional[bool] = None

class LiderBase(BaseModel):
    nombre: str
    dependencia_id: int

class LiderCreate(LiderBase):
    pass

class LiderUpdate(LiderBase):
    pass

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/dependencias", response_model=List[dict])
def list_dependencias_admin(db: Session = Depends(get_db), _=Depends(get_current_user)):
    deps = db.query(Dependencia).order_by(Dependencia.prioridad).all()
    return [{
        "id": d.id,
        "nombre": d.nombre,
        "email": d.email,
        "prioridad": d.prioridad,
        "activo": d.activo
    } for d in deps]

@router.put("/dependencias/{dep_id}")
def update_dependencia(dep_id: int, data: DependenciaUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dep = db.query(Dependencia).filter(Dependencia.id == dep_id).first()
    if not dep:
        raise HTTPException(404, "Dependencia no encontrada")
    
    dep.nombre = data.nombre
    dep.email = data.email
    if data.prioridad is not None:
        dep.prioridad = data.prioridad
    if data.activo is not None:
        dep.activo = data.activo
        
    db.commit()
    return {"ok": True}

@router.get("/lideres", response_model=List[dict])
def list_lideres_admin(db: Session = Depends(get_db), _=Depends(get_current_user)):
    lideres = db.query(Lider).all()
    return [{
        "id": l.id,
        "nombre": l.nombre,
        "dependencia_id": l.dependencia_id,
        "dependencia": l.dependencia.nombre if l.dependencia else "",
        "email": l.dependencia.email if l.dependencia else ""
    } for l in lideres]

@router.post("/lideres")
def create_lider(data: LiderCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    nuevo = Lider(nombre=data.nombre, dependencia_id=data.dependencia_id)
    db.add(nuevo)
    db.commit()
    return {"id": nuevo.id}

@router.put("/lideres/{lider_id}")
def update_lider(lider_id: int, data: LiderUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lider = db.query(Lider).filter(Lider.id == lider_id).first()
    if not lider:
        raise HTTPException(404, "Líder no encontrado")
    
    lider.nombre = data.nombre
    lider.dependencia_id = data.dependencia_id
    db.commit()
    return {"ok": True}

@router.delete("/lideres/{lider_id}")
def delete_lider(lider_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lider = db.query(Lider).filter(Lider.id == lider_id).first()
    if not lider:
        raise HTTPException(404, "Líder no encontrado")
    db.delete(lider)
    db.commit()
    return {"ok": True}

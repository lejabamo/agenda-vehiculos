from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.conductor import Conductor

router = APIRouter()


class ConductorCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None


class ConductorUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


@router.get("/")
def list_conductores(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Conductor).order_by(Conductor.nombre).all()


@router.post("/", status_code=201)
def create_conductor(data: ConductorCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = Conductor(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{conductor_id}")
def update_conductor(conductor_id: int, data: ConductorUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Conductor).filter(Conductor.id == conductor_id).first()
    if not c:
        raise HTTPException(404, "Conductor no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{conductor_id}")
def delete_conductor(conductor_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Conductor).filter(Conductor.id == conductor_id).first()
    if not c:
        raise HTTPException(404, "Conductor no encontrado")
    c.activo = False
    db.commit()
    return {"ok": True}

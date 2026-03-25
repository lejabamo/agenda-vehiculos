from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehiculo import Vehiculo
from app.models.conductor import Conductor

router = APIRouter()

# ── Vehiculos ─────────────────────────────────────────────────────────────────

class VehiculoCreate(BaseModel):
    placa: str
    marca: str
    modelo: str
    anio: Optional[int] = None
    color: Optional[str] = None


class VehiculoUpdate(BaseModel):
    placa: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    activo: Optional[bool] = None


@router.get("/")
def list_vehiculos(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Vehiculo).order_by(Vehiculo.placa).all()


@router.post("/", status_code=201)
def create_vehiculo(data: VehiculoCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    existing = db.query(Vehiculo).filter(Vehiculo.placa == data.placa.upper()).first()
    if existing:
        raise HTTPException(409, f"Ya existe un vehículo con placa {data.placa}")
    dump = data.model_dump()
    dump["placa"] = dump["placa"].upper()
    v = Vehiculo(**dump)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.patch("/{vehiculo_id}")
def update_vehiculo(vehiculo_id: int, data: VehiculoUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vehiculo_id}")
def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    v.activo = False
    db.commit()
    return {"ok": True}

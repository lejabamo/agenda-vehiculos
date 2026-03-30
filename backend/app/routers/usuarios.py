from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.usuario import Usuario

router = APIRouter()

# Schema
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    role: str = "ADMIN"

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    role: str
    activo: bool
    class Config:
        from_attributes = True

# CRUD
@router.get("/", response_model=List[UsuarioOut])
def list_usuarios(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Ver todos los administradores del sistema."""
    return db.query(Usuario).all()

@router.post("/", response_model=UsuarioOut)
def create_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Dar de alta a un nuevo directivo SEDC."""
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    new_user = Usuario(
        nombre=data.nombre,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/{user_id}", response_model=UsuarioOut)
def update_usuario(user_id: int, data: UsuarioUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Actualizar perfil o pausar/activar cuenta."""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if data.nombre is not None: user.nombre = data.nombre
    if data.email is not None: user.email = data.email
    if data.password is not None: user.hashed_password = get_password_hash(data.password)
    if data.activo is not None: user.activo = data.activo
    
    db.commit()
    db.refresh(user)
    return user

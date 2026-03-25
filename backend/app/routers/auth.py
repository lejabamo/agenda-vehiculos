from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.usuario import Usuario

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nombre: str
    email: str
    role: str


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        nombre=user.nombre,
        email=user.email,
        role=user.role,
    )


@router.get("/me")
def me(db: Session = Depends(get_db), current_user=Depends(__import__("app.core.security", fromlist=["get_current_user"]).get_current_user)):
    return {"id": current_user.id, "nombre": current_user.nombre, "email": current_user.email, "role": current_user.role}

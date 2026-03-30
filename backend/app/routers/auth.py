from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from jose import JWTError, jwt
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.usuario import Usuario
from app.core.mail import send_forgot_password_email
from app.core.config import settings

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Genera token de 30 min y envía email."""
    user = db.query(Usuario).filter(Usuario.email == data.email).first()
    if user:
        token = create_access_token(
            {"sub": str(user.id), "type": "reset"}, 
            expires_delta=timedelta(minutes=30)
        )
        send_forgot_password_email(user.email, token)
    return {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Valida token y actualiza contraseña."""
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "reset":
            raise HTTPException(status_code=400, detail="Token inválido")
            
        user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        user.hashed_password = get_password_hash(data.new_password)
        db.commit()
        return {"message": "Contraseña actualizada."}
    except JWTError:
        raise HTTPException(status_code=400, detail="Token expirado o inválido")

@router.get("/me")
def me(db: Session = Depends(get_db), current_user=Depends(__import__("app.core.security", fromlist=["get_current_user"]).get_current_user)):
    return {"id": current_user.id, "nombre": current_user.nombre, "email": current_user.email, "role": current_user.role}

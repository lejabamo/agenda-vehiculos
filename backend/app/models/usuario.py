from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False, unique=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="ADMIN")  # ADMIN es el único rol ahora
    activo = Column(Boolean, default=True)

from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Dependencia(Base):
    __tablename__ = "dependencias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, unique=True)
    codigo = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    descripcion = Column(String(500), nullable=True)
    # Prioridad en autocomplete (1 = más recurrente, se muestra primero)
    prioridad = Column(Integer, default=99)
    activo = Column(Boolean, default=True)

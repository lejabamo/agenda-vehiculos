from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Conductor(Base):
    __tablename__ = "conductores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    telefono = Column(String(20), nullable=True)
    activo = Column(Boolean, default=True)

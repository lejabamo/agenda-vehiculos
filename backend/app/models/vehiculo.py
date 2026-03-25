from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(20), nullable=False, unique=True)
    marca = Column(String(100), nullable=False)
    modelo = Column(String(100), nullable=False)
    anio = Column(Integer, nullable=True)
    color = Column(String(50), nullable=True)
    activo = Column(Boolean, default=True)

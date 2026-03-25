from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    # True = municipio del Cauca; False = fuera del departamento (ingresado manualmente)
    es_cauca = Column(Boolean, default=True)

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Lider(Base):
    __tablename__ = "lideres"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    telefono = Column(String(20), nullable=True) # Nuevo campo
    dependencia_id = Column(Integer, ForeignKey("dependencias.id"), nullable=False)

    dependencia = relationship("Dependencia", backref="lideres")

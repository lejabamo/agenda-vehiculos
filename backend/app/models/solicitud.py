import enum
from datetime import date
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Text,
    ForeignKey, DateTime, Enum as SAEnum
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Table
from app.core.database import Base

solicitud_institucion_asociacion = Table(
    "solicitudes_instituciones",
    Base.metadata,
    Column("solicitud_id", Integer, ForeignKey("solicitudes.id", ondelete="CASCADE"), primary_key=True),
    Column("institucion_dane", String(20), ForeignKey("instituciones_educativas.codigo_dane", ondelete="CASCADE"), primary_key=True)
)


class EstadoSolicitud(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"
    CANCELADO = "CANCELADO"
    REAGENDADO = "REAGENDADO"
    FINALIZADA = "FINALIZADA"


class TipoVinculacion(str, enum.Enum):
    PLANTA = "PLANTA"
    CONTRATISTA = "CONTRATISTA"
    OTRO = "OTRO"


class Solicitud(Base):
    __tablename__ = "solicitudes"

    id = Column(Integer, primary_key=True, index=True)

    # Dependencia solicitante
    dependencia_id = Column(Integer, ForeignKey("dependencias.id"), nullable=False)
    dependencia = relationship("Dependencia")

    # Datos del desplazamiento
    objeto_desplazamiento = Column(Text, nullable=False)
    fecha_salida = Column(Date, nullable=False)
    fecha_regreso = Column(Date, nullable=False)
    num_dias = Column(Integer, nullable=False)

    municipio_origen = Column(String(100), nullable=False, default="Popayán")
    municipio_destino = Column(String(150), nullable=False)
    fuera_departamento = Column(Boolean, default=False)
    lugar_destino_detalle = Column(String(500), nullable=False)

    # Datos del líder / contacto
    lider_dependencia = Column(String(200), nullable=False)
    email_respuesta = Column(String(200), nullable=False)
    telefono_contacto = Column(String(30), nullable=False)

    # Asignación admin (se completa al aprobar)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=True)
    vehiculo = relationship("Vehiculo")
    conductor_id = Column(Integer, ForeignKey("conductores.id"), nullable=True)
    conductor = relationship("Conductor")

    # Estado y gestión
    estado = Column(
        SAEnum(EstadoSolicitud, name="estado_solicitud_enum"),
        default=EstadoSolicitud.PENDIENTE,
        nullable=False,
    )
    observaciones_admin = Column(Text, nullable=True)

    # Trazabilidad de reagendamientos
    reagendado_de_id = Column(Integer, ForeignKey("solicitudes.id"), nullable=True)
    reagendado_de = relationship("Solicitud", remote_side=[id])

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación con comisionados
    comisionados = relationship("Comisionado", back_populates="solicitud", cascade="all, delete-orphan")

    # Instituciones Educativas a visitar (opcional)
    instituciones_visitadas = relationship(
        "InstitucionEducativa",
        secondary=solicitud_institucion_asociacion,
        backref="solicitudes"
    )

class Comisionado(Base):
    __tablename__ = "comisionados"

    id = Column(Integer, primary_key=True, index=True)
    solicitud_id = Column(Integer, ForeignKey("solicitudes.id"), nullable=False)
    solicitud = relationship("Solicitud", back_populates="comisionados")

    nombre_completo = Column(String(200), nullable=False)
    cargo = Column(String(200), nullable=False)
    tipo_vinculacion = Column(
        SAEnum(TipoVinculacion, name="tipo_vinculacion_enum"),
        nullable=False,
    )

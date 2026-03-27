from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.core.database import Base

class InstitucionEducativa(Base):
    __tablename__ = "instituciones_educativas"

    # Usamos String para los Códigos DANE ya que tienen hasta 12 dígitos y a veces ceros a la izquierda
    codigo_dane = Column(String(20), primary_key=True, index=True) 
    nombre = Column(String(255), nullable=False)
    
    # Foránea hacia la tabla municipios existente
    municipio_id = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    
    # Datos de contacto (actualizables por el Admin)
    direccion = Column(String(255), nullable=True)
    telefono = Column(String(100), nullable=True)
    rector = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Metadata Analítica
    zona = Column(String(50), nullable=True)      # 'URBANA', 'RURAL'
    sector = Column(String(50), nullable=True)    # 'OFICIAL', 'NO OFICIAL'
    estado = Column(String(50), nullable=True)    # 'ANTIGUO-ACTIVO', etc
    
    # Bandera para que el script de sincronización sepa si debe omitir actualizar el contacto
    contacto_editado_admin = Column(Boolean, default=False)

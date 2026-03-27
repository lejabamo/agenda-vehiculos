"""
Seed data: 42 municipios del Cauca + dependencias SEDC recurrentes + conductores iniciales.
Se ejecuta automáticamente al arrancar la app si las tablas están vacías.
"""
from sqlalchemy.orm import Session
from app.models.municipio import Municipio
from app.models.dependencia import Dependencia
from app.models.conductor import Conductor
from app.models.usuario import Usuario
from app.models.lider import Lider
from app.core.security import get_password_hash
import os
import re

# ---------------------------------------------------------------------------
# 42 Municipios del Cauca (DANE - orden alfabético)
# ---------------------------------------------------------------------------
MUNICIPIOS_CAUCA = [
    "Almaguer", "Argelia", "Balboa", "Bolívar", "Buenos Aires",
    "Cajibío", "Caldono", "Caloto", "Corinto", "El Tambo",
    "Florencia", "Guachené", "Guapi", "Inzá", "Jambaló",
    "La Sierra", "La Vega", "López de Micay", "Mercaderes", "Miranda",
    "Morales", "Padilla", "Paez (Belalcázar)", "Patía (El Bordo)", "Piamonte",
    "Piendamó", "Popayán", "Puerto Tejada", "Puracé (Coconuco)", "Rosas",
    "San Sebastián", "Santa Rosa", "Santander de Quilichao", "Silvia", "Sotara (Paispamba)",
    "Suárez", "Sucre", "Timbío", "Timbiquí", "Toribío",
    "Totoró", "Villa Rica",
]

# ---------------------------------------------------------------------------
# Dependencias SEDC — priorizadas por recurrencia (prioridad 1 = más usada)
# ---------------------------------------------------------------------------
DEPENDENCIAS_SEDC = [
    {"nombre": "Cobertura", "prioridad": 1},
    {"nombre": "Inspección y Vigilancia", "prioridad": 2},
    {"nombre": "Calidad", "prioridad": 3},
    {"nombre": "UDAG", "prioridad": 4},
    {"nombre": "Despacho del Secretario", "prioridad": 5},
    {"nombre": "Administrativa y Financiera", "prioridad": 6},
    {"nombre": "Planeación Educativa", "prioridad": 7},
    {"nombre": "Talento Humano", "prioridad": 8},
    {"nombre": "Jurídica", "prioridad": 9},
    {"nombre": "Sistemas y Tecnología", "prioridad": 10},
    {"nombre": "Atención a la Comunidad", "prioridad": 11},
    {"nombre": "Educación para la Democracia", "prioridad": 12},
    {"nombre": "Etnoeducación", "prioridad": 13},
    {"nombre": "Educación Especial e Inclusiva", "prioridad": 14},
    {"nombre": "Otra dependencia", "prioridad": 99},
]

# ---------------------------------------------------------------------------
# Conductores iniciales
# ---------------------------------------------------------------------------
CONDUCTORES_INICIALES = [
    {"nombre": "Hermes Díaz", "telefono": "3172607141"},
    {"nombre": "René Rivera", "telefono": "3206208092"},
]


def run_seed(db: Session):
    """Inserta datos iniciales solo si las tablas están vacías."""

    # Municipios
    if db.query(Municipio).count() == 0:
        for nombre in MUNICIPIOS_CAUCA:
            db.add(Municipio(nombre=nombre, es_cauca=True))
        db.commit()

    # Dependencias - Updated from text file if available
    # Busca archivos en /app/docs (estándar Docker) o relativo al script
    docs_path = "/app/docs"
    if not os.path.exists(docs_path):
        docs_path = os.path.join(os.path.dirname(__file__), "..", "..", "docs")
    
    correos_file = os.path.join(docs_path, "correos dependecias.txt")
    
    if os.path.exists(correos_file):
        with open(correos_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or not line: continue
                parts = re.split(r'\t| {2,}', line)
                if len(parts) >= 3:
                    nombre_dep = parts[1].strip()
                    correo_dep = parts[2].strip()
                    dep = db.query(Dependencia).filter(Dependencia.nombre == nombre_dep).first()
                    if not dep:
                        dep = Dependencia(nombre=nombre_dep, email=correo_dep, prioridad=99)
                        db.add(dep)
                    else:
                        dep.email = correo_dep
        db.commit()

    if db.query(Dependencia).count() == 0:
        for dep in DEPENDENCIAS_SEDC:
            db.add(Dependencia(nombre=dep["nombre"], prioridad=dep["prioridad"]))
        db.commit()

    # Lideres - Updated from text file if available
    lideres_file = os.path.join(docs_path, "Lider-Dependencia.txt")
    if os.path.exists(lideres_file) and db.query(Lider).count() == 0:
        with open(lideres_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or not line: continue
                parts = re.split(r'\t| {2,}', line)
                if len(parts) >= 3:
                    nombre_lider = parts[1].strip()
                    nombre_dep = parts[2].strip()
                    dep = db.query(Dependencia).filter(Dependencia.nombre == nombre_dep).first()
                    if dep:
                        db.add(Lider(nombre=nombre_lider, dependencia_id=dep.id))
        db.commit()

    # Conductores
    if db.query(Conductor).count() == 0:
        for c in CONDUCTORES_INICIALES:
            db.add(Conductor(nombre=c["nombre"], telefono=c["telefono"]))
        db.commit()

    # Usuario admin por defecto
    if db.query(Usuario).count() == 0:
        admin_user = Usuario(
            nombre="Administrador SEDC",
            email="admin@educacion.cauca.gov.co",
            hashed_password=get_password_hash("Admin2024*"),
            role="ADMIN",
        )
        db.add(admin_user)
        db.commit()

if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        run_seed(db)
        print("🌱 Seed finalizado con éxito.")
    finally:
        db.close()

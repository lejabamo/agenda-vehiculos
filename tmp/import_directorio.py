import sys
import os
from sqlalchemy.orm import Session
from datetime import date

# Add parent dir to path
sys.path.append('backend')
from app.core.database import SessionLocal
from app.models.dependencia import Dependencia
from app.models.lider import Lider

def run_import():
    db = SessionLocal()
    try:
        # Import Dependencias
        with open('docs/correos dependecias.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('#') or not line.strip(): continue
                parts = line.split('\t')
                if len(parts) >= 3:
                    nombre = parts[1].strip()
                    email = parts[2].strip()
                    # Check if exists
                    exist = db.query(Dependencia).filter(Dependencia.nombre == nombre).first()
                    if not exist:
                        db.add(Dependencia(nombre=nombre, email=email, activo=True))
        db.commit()

        # Import Lideres
        with open('docs/Lider-Dependencia.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('#') or not line.strip(): continue
                parts = line.split('\t')
                if len(parts) >= 3:
                    nombre_lider = parts[1].strip()
                    nombre_dep = parts[2].strip()
                    
                    dep = db.query(Dependencia).filter(Dependencia.nombre == nombre_dep).first()
                    if dep:
                        exist_lider = db.query(Lider).filter(Lider.nombre == nombre_lider).first()
                        if not exist_lider:
                            db.add(Lider(nombre=nombre_lider, dependencia_id=dep.id))
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    run_import()

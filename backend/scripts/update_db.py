import sys
import os
import re
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.dependencia import Dependencia
from app.models.municipio import Municipio
from app.models.lider import Lider

data = """1 Secretaría de Educación y Cultura del Cauca educacion@cauca.gov.co
2 Subsecretaría de Educación y Cultura del Cauca subsecretaria.educacion@cauca.gov.co
3 Coordinación de Cultura Departamental cultura@cauca.gov.co
4 Oficina de Gestión de Calidad gestiondecalidad@cauca.gov.co
5 Oficina de Planeación Educativa planeacioneducativa.educacion@cauca.gov.co
6 Oficina de Inspección y Vigilancia inspeccionyvigilancia.educacion@cauca.gov.co
7 Oficina de Servicios Informáticos del Sector Educativo serviciosinformaticos@cauca.gov.co
8 Oficina Administrativa y Financiera administrativayfinanciera.educacion@cauca.gov.co
9 Oficina de Talento Humano talentohumano.educacion@cauca.gov.co
10 Servicio de Atención al Ciudadano y Correspondencia sac.educacion@cauca.gov.co
11 Oficina Escalafón escalafon.educacion@cauca.gov.co
12 Oficina de Prestaciones Sociales prestacionessociales.educacion@cauca.gov.co
13 Oficina de Nómina nomina.educacion@cauca.gov.co
14 Oficina de Historias Laborales historiaslaborales.educacion@cauca.gov.co
15 Oficina de Infraestructura Educativa infraestructuraeducativa.educacion@cauca.gov.co
16 Calidad Educativa calidadeducativa@cauca.gov.co
17 Oficina de Cobertura Educativa coberturaeducativa@cauca.gov.co
18 Oficina de Bienestar, Seguridad y Salud en el Trabajo bienestarsst.educacion@cauca.gov.co
19 Oficina Financiera financiera.educacion@cauca.gov.co
20 Oficina Jurídica de Educación juridica.educacion@cauca.gov.co
21 Unidad de Apoyo a la Gestión unidadesdeapoyoalagestion@cauca.gov.co
22 Comunicaciones prensa.educacion@cauca.gov.co"""

def run():
    db = SessionLocal()
    try:
        # 1. Update Dependencias from data string
        lines = data.split('\n')
        for line in lines:
            if not line.strip(): continue
            parts = line.split(' ')
            dep_id = int(parts[0])
            email = parts[-1]
            nombre = ' '.join(parts[1:-1])
            
            dep = db.query(Dependencia).filter(Dependencia.id == dep_id).first()
            if dep:
                dep.nombre = nombre
                dep.email = email
            else:
                db.add(Dependencia(id=dep_id, nombre=nombre, email=email, prioridad=99))
        
        # 2. Capitalize Municipios
        municipios = db.query(Municipio).all()
        for m in municipios:
            if m.nombre:
                m.nombre = m.nombre.title()
                
        # 3. Import Líderes from Lider-Dependencia.txt (searching multiple paths)
        possible_paths = [
            os.path.join(os.getcwd(), "Lider-Dependencia.txt"),
            os.path.join(os.getcwd(), "docs", "Lider-Dependencia.txt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "Lider-Dependencia.txt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "Lider-Dependencia.txt"),
        ]
        
        lideres_file = None
        for p in possible_paths:
            if os.path.exists(p):
                lideres_file = p
                print(f"   🔎 Encontrado Líderes en: {p}")
                break
                
        if lideres_file:
            db.query(Lider).delete() # wipe old to prevent duplicates
            with open(lideres_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("#") or not line: continue
                    parts = re.split(r'\t+', line)
                    if len(parts) >= 3:
                        nombre_lider = parts[1].strip()
                        nombre_dep = parts[2].strip()
                        dep = db.query(Dependencia).filter(Dependencia.nombre.ilike(f"%{nombre_dep}%")).first()
                        if dep:
                            db.add(Lider(nombre=nombre_lider, dependencia_id=dep.id))
        
        db.commit()
        print("Database dependencias and lideres populated successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()

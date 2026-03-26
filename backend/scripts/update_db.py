import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.dependencia import Dependencia
from app.models.municipio import Municipio

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
        
        # Capitalize Municipios
        municipios = db.query(Municipio).all()
        for m in municipios:
            # Capitalize each word properly e.g. "POPAYAN" -> "Popayán"
            # But wait, original DB might not have accents like áéíóú. 
            # Title case is good enough for now.
            if m.nombre:
                m.nombre = m.nombre.title()
                
        db.commit()
        print("Database updated successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()

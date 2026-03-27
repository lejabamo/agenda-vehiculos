import sys
import os
import math
import unicodedata
import pandas as pd
from sqlalchemy import func

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.institucion_educativa import InstitucionEducativa
from app.models.municipio import Municipio

def normalize_text(text):
    if not isinstance(text, str):
        return ""
    # Evitar tildes y mayúsculas para comparar
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return text.lower().strip()

def get_string(val):
    if pd.isna(val): return None
    v = str(val).strip()
    return v if v else None

def get_municipio_id(db, municipio_name, cache):
    norm_name = normalize_text(municipio_name)
    if norm_name in cache:
        return cache[norm_name]
    
    # Manejar excepciones conocidas del Cauca
    replacements = {
        'paez': 'paez (belalcazar)',
        'patia': 'patia (el bordo)',
        'purace': 'purace (coconuco)',
        'sotara': 'sotara (paispamba)'
    }
    search_name = replacements.get(norm_name, norm_name)
    
    # Tratar de buscar en memoria
    # Cargamos todos los municipios a un diccionario
    for m in db.query(Municipio).all():
        db_norm = normalize_text(m.nombre)
        if db_norm == search_name or search_name in db_norm or db_norm in search_name:
            cache[norm_name] = m.id
            return m.id
            
    print(f"  [!] Municipio no encontrado: {municipio_name} ({norm_name})")
    cache[norm_name] = None
    return None

def run():
    print("🚀 Iniciando ingestión de Instituciones Educativas (DUE)...")
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "docs", "DUE-24032026.xlsx")
    
    if not os.path.exists(file_path):
        print(f"❌ Error: No se encontró el archivo DUE en {file_path}")
        return

    # Leer Excel
    try:
        df = pd.read_excel(file_path, dtype={' Código': str, ' Teléfono': str})
    except Exception as e:
        print(f"❌ Error leyendo Excel: {e}")
        return

    # Limpiar nombres de columnas (quitar espacios al inicio/fin)
    df.columns = [c.strip() for c in df.columns]
    
    db = SessionLocal()
    municipio_cache = {}
    
    nuevas = 0
    actualizadas = 0
    omitidas_editadas = 0
    
    try:
        total = len(df)
        for idx, row in df.iterrows():
            if idx % 500 == 0:
                print(f"Procesando {idx}/{total}...")
                
            dane = get_string(row.get('Código'))
            if not dane: continue
            
            nombre = get_string(row.get('Nombre'))
            if not nombre: continue
            
            muni_name = get_string(row.get('Municipio'))
            muni_id = get_municipio_id(db, muni_name, municipio_cache)
            if not muni_id: continue # Saltar si no sabemos a qué municipio va
            
            rector = get_string(row.get('Nombre Rector'))
            telefono = get_string(row.get('Teléfono'))
            email = get_string(row.get('Correo Electrónico'))
            direccion = get_string(row.get('Dirección'))
            zona = get_string(row.get('Zona'))
            sector = get_string(row.get('Sector'))
            estado = get_string(row.get('Estado'))
            
            inst = db.query(InstitucionEducativa).filter(InstitucionEducativa.codigo_dane == dane).first()
            if not inst:
                # Insert-Only
                inst = InstitucionEducativa(
                    codigo_dane=dane,
                    nombre=nombre,
                    municipio_id=muni_id,
                    direccion=direccion,
                    telefono=telefono,
                    rector=rector,
                    email=email,
                    zona=zona,
                    sector=sector,
                    estado=estado,
                    contacto_editado_admin=False
                )
                db.add(inst)
                nuevas += 1
            else:
                # Update (solo si no fue editada manualmente por el Admin)
                inst.nombre = nombre
                inst.zona = zona
                inst.sector = sector
                inst.estado = estado
                if not inst.contacto_editado_admin:
                    inst.direccion = direccion
                    inst.telefono = telefono
                    inst.rector = rector
                    inst.email = email
                    actualizadas += 1
                else:
                    omitidas_editadas += 1

        db.commit()
        print(f"✅ Sincronización finalizada con éxito!")
        print(f"   -> {nuevas} insertadas")
        print(f"   -> {actualizadas} metadatos actualizados")
        print(f"   -> {omitidas_editadas} contacto preservado por edición manual UI")
        
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error fatal durante inserción en DB: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()

from sqlalchemy.orm import Session
from app.models.vehiculo import Vehiculo
from app.models.conductor import Conductor
from app.models.solicitud import Solicitud, Comisionado
from app.models.municipio import Municipio
from app.models.dependencia import Dependencia
from datetime import datetime, timedelta

def seed_test_data(db: Session):
    # Check if we already have test data
    if db.query(Vehiculo).count() > 0:
        return

    # 1. Create a Vehicle
    v = Vehiculo(placa="OVT123", marca="Toyota", modelo="Hilux", anio=2023, color="Blanco", activo=True)
    db.add(v)
    
    # 2. Create a Conductor
    c = Conductor(nombre="Juan Pérez", telefono="3001234567", activo=True)
    db.add(c)
    
    db.commit()
    db.refresh(v)
    db.refresh(c)

    # 3. Get some dependencies and municipios
    dep = db.query(Dependencia).first()
    mun = db.query(Municipio).filter(Municipio.nombre == "Santander de Quilichao").first()
    if not mun: mun = db.query(Municipio).first()

    # 4. Create a Solicitud for next week (PENDIENTE)
    next_monday = (datetime.now() + timedelta(days=(7 - datetime.now().weekday()))).strftime("%Y-%m-%d")
    next_tuesday = (datetime.now() + timedelta(days=(7 - datetime.now().weekday() + 1))).strftime("%Y-%m-%d")

    s1 = Solicitud(
        dependencia_id=dep.id,
        objeto_desplazamiento="Comisión de seguimiento de calidad",
        fecha_salida=next_monday,
        fecha_regreso=next_monday,
        num_dias=1,
        municipio_origen_id=mun.id, # Popayan usually
        municipio_destino_id=mun.id,
        lugar_destino_detalle="Sede Educativa central",
        lider_dependencia="Carlos Lider",
        email_respuesta="carlos@example.com",
        telefono_contacto="3110000000",
        estado="PENDIENTE"
    )
    db.add(s1)
    
    # 5. Create another (APROBADO)
    next_wednesday = (datetime.now() + timedelta(days=(7 - datetime.now().weekday() + 2))).strftime("%Y-%m-%d")
    s2 = Solicitud(
        dependencia_id=dep.id,
        objeto_desplazamiento="Entrega de materiales",
        fecha_salida=next_wednesday,
        fecha_regreso=next_wednesday,
        num_dias=1,
        municipio_origen_id=mun.id,
        municipio_destino_id=mun.id,
        lugar_destino_detalle="Alcaldía Municipal",
        lider_dependencia="Maria Lider",
        email_respuesta="maria@example.com",
        telefono_contacto="3220000000",
        estado="APROBADO",
        vehiculo_id=v.id,
        conductor_id=c.id
    )
    db.add(s2)
    
    db.commit()
    print("✅ Test data seeded successfully for next week.")

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_test_data(db)
    finally:
        db.close()

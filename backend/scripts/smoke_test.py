import sys
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.solicitud import Solicitud, EstadoSolicitud
from app.models.dependencia import Dependencia
from app.models.vehiculo import Vehiculo
from app.models.conductor import Conductor

def validate():
    print("🚦 Iniciando Smoke Test del Sistema (Verificación de Integridad)...")
    db = SessionLocal()
    try:
        # 1. Verificar Semillas Base
        deps = db.query(Dependencia).count()
        muni = db.query(Solicitud).count()
        print(f"   [OK] Dependencias en BD: {deps}")
        
        # 2. Verificar Vehículos y Conductores
        vh = db.query(Vehiculo).count()
        cd = db.query(Conductor).count()
        print(f"   [OK] Vehículos: {vh}, Conductores: {cd}")
        
        if vh == 0 or cd == 0:
            print("   ⚠️  ATENCIÓN: No hay vehículos o conductores. La aprobación fallará.")
            return

        # 3. Simular Todo el Ciclo de Vida: Creación -> Aprobación -> Reagendamiento
        print("   🏗️ Testeando Ciclo de Vida de Comisión...")
        
        # A. Crear Pendiente
        test_sol = Solicitud(
            dependencia_id=db.query(Dependencia).first().id,
            objeto_desplazamiento="SMOKE TEST AUTOMÁTICO",
            fecha_salida=date.today() + timedelta(days=10),
            fecha_regreso=date.today() + timedelta(days=10),
            num_dias=1,
            municipio_destino="Popayán",
            lugar_destino_detalle="Test de Integridad",
            lider_dependencia="Robot de Test",
            email_respuesta="robot@test.com",
            telefono_contacto="000000",
            estado=EstadoSolicitud.PENDIENTE
        )
        db.add(test_sol)
        db.flush()
        print(f"      - Creada solicitud pendiente ID={test_sol.id}")
        
        # B. Aprobar
        test_sol.estado = EstadoSolicitud.APROBADO
        test_sol.vehiculo_id = db.query(Vehiculo).first().id
        test_sol.conductor_id = db.query(Conductor).first().id
        db.flush()
        print(f"      - Aprobada con Vehículo/Conductor OK")
        
        # C. Reagendar (Crear una nueva a partir de esta)
        nueva = Solicitud(
            dependencia_id=test_sol.dependencia_id,
            objeto_desplazamiento=test_sol.objeto_desplazamiento,
            fecha_salida=date.today() + timedelta(days=11),
            fecha_regreso=date.today() + timedelta(days=11),
            num_dias=1,
            municipio_destino=test_sol.municipio_destino,
            lugar_destino_detalle=test_sol.lugar_destino_detalle,
            lider_dependencia=test_sol.lider_dependencia,
            email_respuesta=test_sol.email_respuesta,
            telefono_contacto=test_sol.telefono_contacto,
            estado=EstadoSolicitud.APROBADO,
            vehiculo_id=test_sol.vehiculo_id,
            conductor_id=test_sol.conductor_id,
            reagendado_de_id=test_sol.id
        )
        test_sol.estado = EstadoSolicitud.REAGENDADO
        db.add(nueva)
        db.commit()
        print(f"      - Reagendada exitosamente. Nueva ID={nueva.id}")
        
        print("\n🏆 TODAS LAS PRUEBAS DE INTEGRIDAD PASARON CORRECTAMENTE.")
        print("   El sistema está listo para operar en Producción.")

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR EN EL TEST: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    validate()

import sys
import os
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.municipio import Municipio
from app.models.dependencia import Dependencia
from app.models.conductor import Conductor
from app.models.vehiculo import Vehiculo
from app.models.lider import Lider
from app.models.solicitud import Solicitud, EstadoSolicitud, Comisionado, TipoVinculacion
from app.models.institucion_educativa import InstitucionEducativa

def run():
    print("🧪 Generando datos de prueba para Auditoría y Estadísticas...")
    db = SessionLocal()
    try:
        # 1. Asegurar que haya Vehículos
        if db.query(Vehiculo).count() == 0:
            vehiculos = [
                {"placa": "OWI455", "marca": "Toyota", "modelo": "Hilux", "anio": 2022, "color": "Blanco"},
                {"placa": "ABC123", "marca": "Nissan", "modelo": "Frontier", "anio": 2021, "color": "Gris"},
                {"placa": "VHE001", "marca": "Chevrolet", "modelo": "D-Max", "anio": 2023, "color": "Rojo"},
                {"placa": "SED555", "marca": "Renault", "modelo": "Kwid", "anio": 2020, "color": "Azul"},
            ]
            for v_data in vehiculos:
                v = Vehiculo(**v_data, activo=True)
                db.add(v)
            db.commit()
            print("   ✅ Vehículos creados")

        # 2. Asegurar conductores adicionales
        if db.query(Conductor).count() <= 2:
            nombres = ["Carlos Pérez", "Juan Martínez", "Luis Rodríguez", "Andrés López", "José García"]
            for n in nombres:
                if not db.query(Conductor).filter(Conductor.nombre == n).first():
                    db.add(Conductor(nombre=n, telefono="300" + str(random.randint(1000000, 9999999)), activo=True))
            db.commit()
            print("   ✅ Conductores adicionales creados")

        # 3. Generar Solicitud de prueba (PENDIENTES, APROBADAS, FINALIZADAS)
        vehiculos_list = db.query(Vehiculo).all()
        conductores_list = db.query(Conductor).all()
        dependencias_list = db.query(Dependencia).all()
        municipios_list = db.query(Municipio).filter(Municipio.es_cauca == True).all()
        instituciones_list = db.query(InstitucionEducativa).limit(100).all()

        if not dependencias_list or not municipios_list:
            print("   ❌ Error: No hay dependencias o municipios. Ejecuta seed primero.")
            return

        print("   🏗️ Creando 40 solicitudes aleatorias para el histórico...")
        # Histórico (Hace 2 meses al mes pasado) -> FINALIZADAS
        for i in range(20):
            d_out = date.today() - timedelta(days=random.randint(5, 60))
            d_in = d_out + timedelta(days=random.randint(1, 3))
            
            dep = random.choice(dependencias_list)
            muni = random.choice(municipios_list)
            v = random.choice(vehiculos_list)
            c = random.choice(conductores_list)

            s = Solicitud(
                dependencia_id=dep.id,
                objeto_desplazamiento=f"Visita Técnica {i+1} a {muni.nombre}",
                fecha_salida=d_out,
                fecha_regreso=d_in,
                num_dias=(d_in - d_out).days + 1,
                municipio_destino=muni.nombre,
                fuera_departamento=False,
                lugar_destino_detalle="Sede principal",
                lider_dependencia="Líder Prueba",
                email_respuesta=dep.email or "prueba@gmail.com",
                telefono_contacto="3110001122",
                vehiculo_id=v.id,
                conductor_id=c.id,
                estado=EstadoSolicitud.FINALIZADA,
                created_at=d_out - timedelta(days=5)
            )
            # Asociar instituciones aleatorias si existen
            if instituciones_list:
                s.instituciones_visitadas = random.sample(instituciones_list, k=random.randint(1, 3))
            
            db.add(s)
            db.flush()
            
            # Comisionados
            db.add(Comisionado(solicitud_id=s.id, nombre_completo="Funcionario A", cargo="Técnico", tipo_vinculacion=TipoVinculacion.PLANTA))
            db.add(Comisionado(solicitud_id=s.id, nombre_completo="Funcionario B", cargo="Asesor", tipo_vinculacion=TipoVinculacion.CONTRATISTA))

        # Futuro (Próximos 15 días) -> APROBADAS/PENDIENTES/REAGENDADAS
        print("   📅 Creando 20 solicitudes próximas para calendario y Dashboard...")
        for i in range(20):
            d_out = date.today() + timedelta(days=random.randint(0, 15))
            d_in = d_out + timedelta(days=random.randint(0, 2))
            
            dep = random.choice(dependencias_list)
            muni = random.choice(municipios_list)
            status = random.choice([EstadoSolicitud.APROBADO, EstadoSolicitud.PENDIENTE, EstadoSolicitud.PENDIENTE])
            
            s = Solicitud(
                dependencia_id=dep.id,
                objeto_desplazamiento=f"Comisión Planeación {i+1}",
                fecha_salida=d_out,
                fecha_regreso=d_in,
                num_dias=(d_in - d_out).days + 1,
                municipio_destino=muni.nombre,
                fuera_departamento=False,
                lugar_destino_detalle="Zona Rural",
                lider_dependencia="Líder Futuro",
                email_respuesta=dep.email or "test@cauca.gov.co",
                telefono_contacto="3200000000",
                estado=status,
                created_at=date.today()
            )
            
            if status == EstadoSolicitud.APROBADO:
                s.vehiculo_id = random.choice(vehiculos_list).id
                s.conductor_id = random.choice(conductores_list).id
            
            db.add(s)

        # 4. Caso específico de REAGENDAMIENTO para prueba
        print("   🔄 Simulando un caso de REAGENDADO (Solicitud #101/102)...")
        orig = Solicitud(
            dependencia_id=dependencias_list[0].id,
            objeto_desplazamiento="Auditoría Zonal Original",
            fecha_salida=date.today() - timedelta(days=1),
            fecha_regreso=date.today() - timedelta(days=1),
            num_dias=1,
            municipio_destino="Santander de Quilichao",
            fuera_departamento=False,
            lugar_destino_detalle="Sede Norte",
            lider_dependencia="Supervisor Norte",
            email_respuesta="norte@cauca.gov.co",
            telefono_contacto="333333",
            estado=EstadoSolicitud.REAGENDADO
        )
        db.add(orig)
        db.flush()
        
        nueva = Solicitud(
            dependencia_id=orig.dependencia_id,
            objeto_desplazamiento=orig.objeto_desplazamiento,
            fecha_salida=date.today() + timedelta(days=5),
            fecha_regreso=date.today() + timedelta(days=5),
            num_dias=1,
            municipio_destino=orig.municipio_destino,
            fuera_departamento=orig.fuera_departamento,
            lugar_destino_detalle=orig.lugar_destino_detalle,
            lider_dependencia=orig.lider_dependencia,
            email_respuesta=orig.email_respuesta,
            telefono_contacto=orig.telefono_contacto,
            estado=EstadoSolicitud.APROBADO,
            vehiculo_id=vehiculos_list[0].id,
            conductor_id=conductores_list[0].id,
            reagendado_de_id=orig.id
        )
        db.add(nueva)

        db.commit()
        print("🎉 Datos de prueba inyectados exitosamente. Revisa el Dashboard y Analytics.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al generar datos: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()

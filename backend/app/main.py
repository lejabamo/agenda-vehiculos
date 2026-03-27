from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal, Base

# Import all models so Alembic/metadata are aware of them
from app.models import dependencia, vehiculo, conductor, municipio, usuario, solicitud, institucion_educativa  # noqa

# Routers
from app.routers import auth, solicitudes, vehiculos, conductores, dependencias, municipios, admin, analytics, directorio, instituciones

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(solicitudes.router, prefix="/api/solicitudes", tags=["Solicitudes"])
app.include_router(municipios.router, prefix="/api/municipios", tags=["Municipios"])
app.include_router(instituciones.router, prefix="/api/instituciones", tags=["Instituciones Educativas"])
app.include_router(dependencias.router, prefix="/api/dependencias", tags=["Dependencias"])
app.include_router(vehiculos.router, prefix="/api/admin/vehiculos", tags=["Admin - Vehículos"])
app.include_router(conductores.router, prefix="/api/admin/conductores", tags=["Admin - Conductores"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin - Solicitudes"])
app.include_router(analytics.router, prefix="/api/admin/analytics", tags=["Admin - Analytics"])


@app.on_event("startup")
def on_startup():
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Run seed
    from app.core.seed import run_seed
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

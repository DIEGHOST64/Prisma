"""
Document Service - FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config.config import get_settings
from .config.container import get_container


def create_app() -> FastAPI:
    """Factory para crear la aplicación FastAPI"""
    settings = get_settings()
    container = get_container()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Manejador de ciclo de vida de la aplicación"""
        # Startup
        await container.init_db_pool()
        print("✓ Database pool initialized")
        
        # Registrar rutas después de inicializar la BD
        document_controller = container.document_controller()
        app.include_router(
            document_controller.router,
            prefix="/api/v1/documents",
            tags=["Documents"]
        )

        yield

        # Shutdown
        await container.close_db_pool()
        print("✓ Database pool closed")

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Microservicio para gestión de documentos - Arquitectura Limpia",
        lifespan=lifespan
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Verificar estado del servicio"""
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version
        }

    return app


# Crear instancia de la aplicación
app = create_app()

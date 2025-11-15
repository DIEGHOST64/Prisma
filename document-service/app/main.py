from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .config.config import get_settings
from .config.container import get_container
import os


def create_app() -> FastAPI:
    settings = get_settings()
    container = get_container()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await container.init_db_pool()
        print(' Database pool initialized')

        document_controller = container.document_controller()
        app.include_router(
            document_controller.router,
            prefix='/api/v1/documents',
            tags=['Documents']
        )

        yield

        await container.close_db_pool()
        print(' Database pool closed')

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description='Microservicio para gestión de documentos',
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    storage_path = '/app/storage'
    if os.path.exists(storage_path):
        app.mount('/storage', StaticFiles(directory=storage_path), name='storage')

    @app.get('/health', tags=['Health'])
    async def health_check():
        return {
            'status': 'healthy',
            'service': settings.app_name,
            'version': settings.app_version
        }

    return app


app = create_app()

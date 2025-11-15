"""
Contenedor de dependencias - Dependency Injection
"""
import asyncpg
from functools import lru_cache
from ..config.config import get_settings
from ..infrastructure.persistence.postgres_document_repository import PostgresDocumentRepository
from ..infrastructure.storage.local_storage import LocalStorageRepository
from ..infrastructure.storage.s3_storage import S3StorageRepository
from ..infrastructure.auth.jwt_service import JWTService
from ..application.usecases import (
    UploadDocumentUseCase,
    GetDocumentUrlUseCase,
    GetDocumentsByApplicationUseCase,
    GetDocumentsByUserUseCase,
    DeleteDocumentUseCase
)
from ..presentation.controllers.document_controller import DocumentController


class Container:
    """Contenedor de dependencias"""
    
    def __init__(self):
        self.settings = get_settings()
        self.db_pool = None
        self._jwt_service = None
        self._storage_repository = None
        self._document_repository = None
    
    async def init_db_pool(self):
        """Inicializar pool de conexiones a PostgreSQL"""
        if self.db_pool is None:
            self.db_pool = await asyncpg.create_pool(
                host=self.settings.db_host,
                port=self.settings.db_port,
                database=self.settings.db_name,
                user=self.settings.db_user,
                password=self.settings.db_password,
                min_size=self.settings.db_min_pool_size,
                max_size=self.settings.db_max_pool_size
            )
    
    async def close_db_pool(self):
        """Cerrar pool de conexiones"""
        if self.db_pool is not None:
            await self.db_pool.close()
            self.db_pool = None
    
    def jwt_service(self) -> JWTService:
        """Obtener servicio JWT"""
        if self._jwt_service is None:
            self._jwt_service = JWTService(
                secret_key=self.settings.jwt_secret,
                algorithm=self.settings.jwt_algorithm
            )
        return self._jwt_service
    
    def storage_repository(self):
        """Obtener repositorio de storage segÃºn configuraciÃ³n"""
        if self._storage_repository is None:
            if self.settings.storage_type == "s3":
                self._storage_repository = S3StorageRepository(
                    aws_access_key_id=self.settings.aws_access_key_id,
                    aws_secret_access_key=self.settings.aws_secret_access_key,
                    region_name=self.settings.aws_region,
                    bucket_name=self.settings.s3_bucket_name,
                    url_expiration=self.settings.s3_url_expiration
                )
            else:
                self._storage_repository = LocalStorageRepository(
                    storage_path=self.settings.storage_base_path
                )
        return self._storage_repository
    
    def document_repository(self):
        """Obtener repositorio de documentos"""
        if self._document_repository is None:
            if self.db_pool is None:
                raise RuntimeError("Database pool not initialized")
            self._document_repository = PostgresDocumentRepository(self.db_pool)
        return self._document_repository
    
    # Use Cases
    
    def upload_document_usecase(self) -> UploadDocumentUseCase:
        """Obtener caso de uso para subir documentos"""
        return UploadDocumentUseCase(
            document_repository=self.document_repository(),
            storage_repository=self.storage_repository()
        )
    
    def get_document_url_usecase(self) -> GetDocumentUrlUseCase:
        """Obtener caso de uso para obtener URL de documento"""
        return GetDocumentUrlUseCase(
            document_repository=self.document_repository(),
            storage_repository=self.storage_repository()
        )
    
    def get_documents_by_application_usecase(self) -> GetDocumentsByApplicationUseCase:
        """Obtener caso de uso para listar documentos por postulaciÃ³n"""
        return GetDocumentsByApplicationUseCase(
            document_repository=self.document_repository()
        )
    
    def get_documents_by_user_usecase(self) -> GetDocumentsByUserUseCase:
        """Obtener caso de uso para listar documentos por usuario"""
        return GetDocumentsByUserUseCase(
            document_repository=self.document_repository()
        )
    
    def delete_document_usecase(self) -> DeleteDocumentUseCase:
        """Obtener caso de uso para eliminar documentos"""
        return DeleteDocumentUseCase(
            document_repository=self.document_repository(),
            storage_repository=self.storage_repository()
        )
    
    # Controllers
    
    def document_controller(self) -> DocumentController:
        """Obtener controlador de documentos"""
        return DocumentController(
            upload_document_usecase=self.upload_document_usecase(),
            get_document_url_usecase=self.get_document_url_usecase(),
            get_documents_by_application_usecase=self.get_documents_by_application_usecase(),
            get_documents_by_user_usecase=self.get_documents_by_user_usecase(),
            delete_document_usecase=self.delete_document_usecase()
        )


@lru_cache()
def get_container() -> Container:
    """Obtener instancia singleton del contenedor"""
    return Container()

"""
Caso de uso: Subir documento
"""
from typing import BinaryIO
from datetime import datetime
import uuid
from ...domain.entities.document import Document
from ...domain.repositories.document_repository import IDocumentRepository
from ...domain.repositories.storage_repository import IStorageRepository


class UploadDocumentUseCase:
    """Caso de uso para subir documentos"""
    
    def __init__(
        self,
        document_repository: IDocumentRepository,
        storage_repository: IStorageRepository
    ):
        self.document_repository = document_repository
        self.storage_repository = storage_repository
    
    async def execute(
        self,
        file_content: bytes,
        filename: str,
        file_size: int,
        mime_type: str,
        user_document: str,
        application_id: str,
        document_type: str,
        uploaded_by: Optional[str]
    ) -> Document:
        """
        Subir documento al storage y guardar metadata en BD
        
        Args:
            file_content: Contenido del archivo en bytes
            filename: Nombre del archivo
            file_size: Tamaño del archivo en bytes
            mime_type: Tipo MIME del archivo
            user_document: Número de documento del usuario
            application_id: ID de la postulación
            document_type: Tipo de documento (cv, carta_presentacion, etc)
            uploaded_by: ID del usuario que sube el archivo
            
        Returns:
            Document: Documento creado
            
        Raises:
            ValueError: Si los datos son inválidos
            Exception: Si falla el upload al storage
        """
        # Validaciones
        if file_size > 10 * 1024 * 1024:  # 10 MB
            raise ValueError("El archivo no puede superar los 10 MB")
        
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ]
        
        if mime_type not in allowed_types:
            raise ValueError(f"Tipo de archivo no permitido: {mime_type}")
        
        # Generar ID único para el documento
        document_id = str(uuid.uuid4())
        
        # Generar ruta del archivo con timestamp para evitar colisiones
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        extension = filename.split('.')[-1]
        new_filename = f"{document_type}_{timestamp}.{extension}"
        
        # Subir archivo al storage
        try:
            stored_path = await self.storage_repository.upload_file(
                file_content=file_content,
                filename=new_filename,
                content_type=mime_type
            )
        except Exception as e:
            raise Exception(f"Error al subir archivo: {str(e)}")
        
        # Crear entidad Document
        document = Document(
            id=document_id,
            user_document=user_document,
            application_id=application_id,
            filename=new_filename,
            original_filename=filename,
            file_path=stored_path,
            file_size=file_size,
            mime_type=mime_type,
            document_type=document_type,
            uploaded_at=datetime.utcnow(),
            uploaded_by=uploaded_by
        )
        
        # Guardar metadata en base de datos
        saved_document = await self.document_repository.save(document)
        
        return saved_document

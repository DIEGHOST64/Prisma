"""
Caso de uso: Obtener URL de documento
"""
from typing import Optional
from ...domain.repositories.document_repository import IDocumentRepository
from ...domain.repositories.storage_repository import IStorageRepository


class GetDocumentUrlUseCase:
    """Caso de uso para obtener URL de acceso a un documento"""
    
    def __init__(
        self,
        document_repository: IDocumentRepository,
        storage_repository: IStorageRepository
    ):
        self.document_repository = document_repository
        self.storage_repository = storage_repository
    
    async def execute(self, document_id: str) -> Optional[str]:
        """
        Obtener URL de acceso a un documento
        
        Args:
            document_id: ID del documento
            
        Returns:
            URL del documento o None si no existe
        """
        # Buscar documento en BD
        document = await self.document_repository.find_by_id(document_id)
        
        if document is None:
            return None
        
        # Obtener URL del storage
        url = await self.storage_repository.get_file_url(document.file_path)
        
        return url

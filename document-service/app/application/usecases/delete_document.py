"""
Caso de uso: Eliminar documento
"""
from ...domain.repositories.document_repository import IDocumentRepository
from ...domain.repositories.storage_repository import IStorageRepository


class DeleteDocumentUseCase:
    """Caso de uso para eliminar un documento"""
    
    def __init__(
        self,
        document_repository: IDocumentRepository,
        storage_repository: IStorageRepository
    ):
        self.document_repository = document_repository
        self.storage_repository = storage_repository
    
    async def execute(self, document_id: str) -> bool:
        """
        Eliminar documento del storage y de la BD
        
        Args:
            document_id: ID del documento
            
        Returns:
            True si se eliminó correctamente, False si no existe
        """
        # Buscar documento en BD
        document = await self.document_repository.find_by_id(document_id)
        
        if document is None:
            return False
        
        # Eliminar del storage
        try:
            await self.storage_repository.delete_file(document.file_path)
        except Exception:
            # Si falla la eliminación del storage, continuamos
            # para eliminar al menos el registro de BD
            pass
        
        # Eliminar de la base de datos
        deleted = await self.document_repository.delete(document_id)
        
        return deleted

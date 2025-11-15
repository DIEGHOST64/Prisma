"""
Caso de uso: Obtener documentos por postulación
"""
from ...domain.entities.document import Document
from ...domain.repositories.document_repository import IDocumentRepository


class GetDocumentsByApplicationUseCase:
    """Caso de uso para obtener todos los documentos de una postulación"""
    
    def __init__(self, document_repository: IDocumentRepository):
        self.document_repository = document_repository
    
    async def execute(self, application_id: str) -> list[Document]:
        """
        Obtener todos los documentos de una postulación
        
        Args:
            application_id: ID de la postulación
            
        Returns:
            Lista de documentos
        """
        documents = await self.document_repository.find_by_application_id(application_id)
        return documents

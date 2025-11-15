"""
Caso de uso: Obtener documentos por usuario
"""
from ...domain.entities.document import Document
from ...domain.repositories.document_repository import IDocumentRepository


class GetDocumentsByUserUseCase:
    """Caso de uso para obtener todos los documentos de un usuario"""
    
    def __init__(self, document_repository: IDocumentRepository):
        self.document_repository = document_repository
    
    async def execute(self, user_document: str) -> list[Document]:
        """
        Obtener todos los documentos de un usuario
        
        Args:
            user_document: Número de documento del usuario
            
        Returns:
            Lista de documentos
        """
        documents = await self.document_repository.find_by_user_document(user_document)
        return documents

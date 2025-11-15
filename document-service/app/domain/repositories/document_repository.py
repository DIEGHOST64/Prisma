"""
Interfaz del repositorio de documentos
"""
from abc import ABC, abstractmethod
from typing import Optional
from ..entities.document import Document


class IDocumentRepository(ABC):
    """Interfaz para el repositorio de documentos"""
    
    @abstractmethod
    async def save(self, document: Document) -> Document:
        """Guardar documento en la base de datos"""
        pass
    
    @abstractmethod
    async def find_by_id(self, document_id: str) -> Optional[Document]:
        """Buscar documento por ID"""
        pass
    
    @abstractmethod
    async def find_by_user_document(self, user_document: str) -> list[Document]:
        """Buscar todos los documentos de un usuario por su número de documento"""
        pass
    
    @abstractmethod
    async def find_by_application_id(self, application_id: str) -> list[Document]:
        """Buscar todos los documentos de una postulación"""
        pass
    
    @abstractmethod
    async def delete(self, document_id: str) -> bool:
        """Eliminar documento de la base de datos"""
        pass
    
    @abstractmethod
    async def exists_by_id(self, document_id: str) -> bool:
        """Verificar si existe un documento por ID"""
        pass

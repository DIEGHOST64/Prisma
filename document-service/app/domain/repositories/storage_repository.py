"""
Storage Repository Interface - Clean Architecture
"""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class IStorageRepository(ABC):
    """Interface para almacenamiento de archivos"""
    
    @abstractmethod
    async def upload_file(
        self, 
        file_content: bytes, 
        filename: str,
        content_type: str
    ) -> str:
        """
        Subir archivo al storage
        
        Args:
            file_content: Contenido del archivo en bytes
            filename: Nombre del archivo
            content_type: Tipo MIME del archivo
            
        Returns:
            Ruta del archivo en storage
        """
        pass
    
    @abstractmethod
    async def get_file_url(self, file_path: str, expiration: int = 3600) -> str:
        """
        Obtener URL del archivo (firmada si es S3)
        
        Args:
            file_path: Ruta del archivo
            expiration: Tiempo de expiración en segundos
            
        Returns:
            URL del archivo
        """
        pass
    
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """
        Eliminar archivo del storage
        
        Args:
            file_path: Ruta del archivo
            
        Returns:
            True si se eliminó correctamente
        """
        pass
    
    @abstractmethod
    async def file_exists(self, file_path: str) -> bool:
        """
        Verificar si el archivo existe
        
        Args:
            file_path: Ruta del archivo
            
        Returns:
            True si existe
        """
        pass

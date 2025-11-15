"""
Implementación PostgreSQL del repositorio de documentos
"""
import asyncpg
from typing import Optional
from datetime import datetime
from ...domain.entities.document import Document
from ...domain.repositories.document_repository import IDocumentRepository


class PostgresDocumentRepository(IDocumentRepository):
    """Repositorio de documentos usando PostgreSQL"""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
    
    async def save(self, document: Document) -> Document:
        """Guardar documento en la base de datos"""
        query = """
            INSERT INTO documents (
                id, user_document, application_id, filename, original_filename, 
                file_path, file_size, mime_type, document_type,
                uploaded_at, uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                document.id,
                document.user_document,
                document.application_id,
                document.filename,
                document.original_filename,
                document.file_path,
                document.file_size,
                document.mime_type,
                document.document_type,
                document.uploaded_at,
                document.uploaded_by
            )
            
            return self._row_to_document(row)
    
    async def find_by_id(self, document_id: str) -> Optional[Document]:
        """Buscar documento por ID"""
        query = "SELECT * FROM documents WHERE id = $1"
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, document_id)
            
            if row is None:
                return None
            
            return self._row_to_document(row)
    
    async def find_by_user_document(self, user_document: str) -> list[Document]:
        """Buscar todos los documentos de un usuario"""
        query = """
            SELECT * FROM documents 
            WHERE user_document = $1 
            ORDER BY uploaded_at DESC
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, user_document)
            
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_application_id(self, application_id: str) -> list[Document]:
        """Buscar todos los documentos de una postulación"""
        query = """
            SELECT * FROM documents 
            WHERE application_id = $1 
            ORDER BY uploaded_at DESC
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, application_id)
            
            return [self._row_to_document(row) for row in rows]
    
    async def delete(self, document_id: str) -> bool:
        """Eliminar documento de la base de datos"""
        query = "DELETE FROM documents WHERE id = $1"
        
        async with self.db_pool.acquire() as conn:
            result = await conn.execute(query, document_id)
            
            # result será "DELETE 1" si se eliminó un registro
            return result == "DELETE 1"
    
    async def exists_by_id(self, document_id: str) -> bool:
        """Verificar si existe un documento"""
        query = "SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1)"
        
        async with self.db_pool.acquire() as conn:
            exists = await conn.fetchval(query, document_id)
            
            return exists
    
    def _row_to_document(self, row) -> Document:
        """Convertir fila de base de datos a entidad Document"""
        return Document(
            id=str(row['id']),
            user_document=row['user_document'],
            application_id=str(row['application_id']),
            filename=row['filename'],
            original_filename=row['original_filename'],
            file_path=row['file_path'],
            file_size=row['file_size'],
            mime_type=row['mime_type'],
            document_type=row['document_type'],
            uploaded_at=row['uploaded_at'],
            uploaded_by=str(row['uploaded_by']) if row['uploaded_by'] else None
        )

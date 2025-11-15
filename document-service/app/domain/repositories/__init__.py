"""
Domain Repositories
"""
from .storage_repository import IStorageRepository
from .document_repository import IDocumentRepository

__all__ = ['IStorageRepository', 'IDocumentRepository']

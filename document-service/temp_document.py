"""
Document Entity - Clean Architecture
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Document(BaseModel):
    """Entidad Document - representa un archivo subido"""
    
    id: str = Field(..., description="UUID del documento")
    user_document: str = Field(..., description="Número de documento del usuario")
    application_id: str = Field(..., description="UUID de la postulación")
    filename: str = Field(..., description="Nombre del archivo en storage")
    original_filename: str = Field(..., description="Nombre original del archivo")
    file_path: str = Field(..., description="Ruta del archivo en storage")
    file_size: int = Field(..., description="Tamaño en bytes")
    mime_type: str = Field(..., description="Tipo MIME del archivo")
    document_type: str = Field(..., description="Tipo de documento")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Fecha de subida")
    uploaded_by: str = Field(..., description="UUID del usuario que subió")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_document": "1234567890",
                "application_id": "123e4567-e89b-12d3-a456-426614174001",
                "filename": "cv_20251113_120000.pdf",
                "original_filename": "Mi CV.pdf",
                "file_path": "2025/11/cv_20251113_120000.pdf",
                "file_size": 524288,
                "mime_type": "application/pdf",
                "document_type": "cv",
                "uploaded_at": "2025-11-13T12:00:00",
                "uploaded_by": "system"
            }
        }


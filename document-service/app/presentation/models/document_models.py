"""
Modelos de presentación - DTOs
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UploadDocumentRequest(BaseModel):
    """Request para subir documento"""
    user_document: str = Field(..., description="Número de documento del usuario")
    application_id: str = Field(..., description="ID de la postulación")
    document_type: str = Field(..., description="Tipo de documento (cv, carta_presentacion, etc)")


class DocumentResponse(BaseModel):
    """Response con información del documento"""
    id: str
    user_document: str
    application_id: str
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    document_type: str
    uploaded_at: datetime
    uploaded_by: Optional[str]
    
    class Config:
        from_attributes = True


class DocumentUrlResponse(BaseModel):
    """Response con URL del documento"""
    document_id: str
    url: str


class ErrorResponse(BaseModel):
    """Response para errores"""
    detail: str

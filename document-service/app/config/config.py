"""
Configuración de la aplicación
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Aplicación
    app_name: str = "Document Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Base de datos
    db_host: str = "localhost"
    db_port: int = 5434
    db_name: str = "document_db"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_min_pool_size: int = 5
    db_max_pool_size: int = 20
    
    # JWT
    jwt_secret: str = "your_jwt_secret_change_in_production"
    jwt_algorithm: str = "HS256"
    
    # Storage
    storage_type: str = "local"  # "local" o "s3"
    storage_base_path: str = "./storage"
    
    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = ""
    s3_url_expiration: int = 3600  # 1 hora
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def database_url(self) -> str:
        """URL de conexión a PostgreSQL"""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


@lru_cache()
def get_settings() -> Settings:
    """Obtener instancia singleton de configuración"""
    return Settings()

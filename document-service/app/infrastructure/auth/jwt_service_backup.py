"""
JWT Service - Verificación de tokens
"""
from jose import JWTError, jwt
from typing import Optional


class JWTService:
    """Servicio para verificar tokens JWT del Auth Service"""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verificar y decodificar token JWT
        
        Args:
            token: Token JWT
            
        Returns:
            Payload del token o None si es inválido
        """
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            return payload
        except JWTError:
            return None
    
    def extract_token_from_header(self, authorization: str) -> Optional[str]:
        """
        Extraer token del header Authorization
        
        Args:
            authorization: Header Authorization completo
            
        Returns:
            Token extraído o None
        """
        if not authorization:
            return None
        
        parts = authorization.split()
        
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        return parts[1]

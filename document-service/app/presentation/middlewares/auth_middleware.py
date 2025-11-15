"""
Middleware de autenticación JWT
"""
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from ...infrastructure.auth.jwt_service import JWTService


security = HTTPBearer()


class AuthMiddleware:
    """Middleware para verificar autenticación JWT"""
    
    def __init__(self, jwt_service: JWTService):
        self.jwt_service = jwt_service
    
    async def __call__(
        self, 
        request: Request,
        credentials: HTTPAuthorizationCredentials
    ) -> dict:
        """
        Verificar token JWT
        
        Args:
            request: Request de FastAPI
            credentials: Credenciales del header Authorization
            
        Returns:
            Payload del token
            
        Raises:
            HTTPException: Si el token es inválido
        """
        token = credentials.credentials
        
        payload = self.jwt_service.verify_token(token)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado"
            )
        
        # Agregar payload al request state
        request.state.user = payload
        
        return payload


def require_auth(jwt_service: JWTService):
    """Dependency para requerir autenticación"""
    return AuthMiddleware(jwt_service)


def require_roles(jwt_service: JWTService, allowed_roles: list[str]):
    """
    Dependency para requerir roles específicos
    
    Args:
        jwt_service: Servicio JWT
        allowed_roles: Lista de roles permitidos
    """
    async def check_roles(
        request: Request,
        credentials: HTTPAuthorizationCredentials
    ) -> dict:
        # Primero verificar autenticación
        auth_middleware = AuthMiddleware(jwt_service)
        payload = await auth_middleware(request, credentials)
        
        # Verificar rol
        user_role = payload.get('role')
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        
        return payload
    
    return check_roles

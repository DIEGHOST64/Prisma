from jose import JWTError, jwt
from typing import Optional


class JWTService:
    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def verify_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={'verify_aud': False, 'verify_iss': False}
            )
            return payload
        except JWTError as e:
            print(f'JWT Error: {e}')
            return None

    def extract_token_from_header(self, authorization: str) -> Optional[str]:
        if not authorization:
            return None

        parts = authorization.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        return parts[1]

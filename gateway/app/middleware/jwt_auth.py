from jose import JWTError, jwt

from app.config.settings import settings


class TokenValidationError(Exception):
    pass


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise TokenValidationError("Invalid or expired token") from exc

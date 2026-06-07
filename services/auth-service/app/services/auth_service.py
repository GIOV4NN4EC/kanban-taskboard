from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordReset, UserLogin, UserRegister
from app.utils.security import create_access_token, hash_password, verify_password


class AuthServiceError(Exception):
    pass


class EmailAlreadyExistsError(AuthServiceError):
    pass


class InvalidCredentialsError(AuthServiceError):
    pass


class AuthService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def register(self, data: UserRegister) -> tuple[User, str]:
        if self.repo.get_by_email(data.email):
            raise EmailAlreadyExistsError("Email already registered")
        user = self.repo.create(
            email=data.email,
            password_hash=hash_password(data.password),
            name=data.name,
        )
        token = create_access_token(user.id, user.email)
        return user, token

    def login(self, data: UserLogin) -> tuple[User, str]:
        user = self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")
        token = create_access_token(user.id, user.email)
        return user, token

    def reset_password(self, data: PasswordReset) -> None:
        user = self.repo.get_by_email(data.email)
        if not user:
            raise InvalidCredentialsError("Invalid email or password")
        self.repo.update_password(user, hash_password(data.new_password))

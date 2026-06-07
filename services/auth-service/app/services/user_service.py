from uuid import UUID

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordChange, UserUpdate
from app.utils.security import hash_password, verify_password


class UserNotFoundError(Exception):
    pass


class InvalidPasswordError(Exception):
    pass


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def get_by_id(self, user_id: UUID) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        return user

    def get_by_email(self, email: str) -> User:
        user = self.repo.get_by_email(email)
        if not user:
            raise UserNotFoundError("User not found")
        return user

    def update_profile(self, user_id: UUID, data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        updates = data.model_dump(exclude_unset=True)
        return self.repo.update(user, **updates)

    def delete_profile(self, user_id: UUID) -> None:
        user = self.get_by_id(user_id)
        self.repo.delete(user)

    def change_password(self, user_id: UUID, data: PasswordChange) -> None:
        user = self.get_by_id(user_id)
        if not verify_password(data.current_password, user.password_hash):
            raise InvalidPasswordError("Current password is incorrect")
        self.repo.update_password(user, hash_password(data.new_password))

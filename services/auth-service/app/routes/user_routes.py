from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordChange, UserPublic, UserUpdate
from app.services.user_service import InvalidPasswordError, UserNotFoundError, UserService

router = APIRouter(prefix="/users", tags=["users"])


def get_current_user_id(x_user_id: str | None = Header(default=None)) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id") from exc


@router.get("/me", response_model=UserPublic)
def get_me(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserPublic:
    service = UserService(UserRepository(db))
    try:
        user = service.get_by_id(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return UserPublic.model_validate(user)


@router.put("/me", response_model=UserPublic)
def update_me(
    data: UserUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserPublic:
    service = UserService(UserRepository(db))
    try:
        user = service.update_profile(user_id, data)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return UserPublic.model_validate(user)


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: PasswordChange,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service = UserService(UserRepository(db))
    try:
        service.change_password(user_id, data)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service = UserService(UserRepository(db))
    try:
        service.delete_profile(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: UUID, db: Session = Depends(get_db)) -> UserPublic:
    service = UserService(UserRepository(db))
    try:
        user = service.get_by_id(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return UserPublic.model_validate(user)


@router.get("/by-email/{email}", response_model=UserPublic)
def get_user_by_email(email: str, db: Session = Depends(get_db)) -> UserPublic:
    service = UserService(UserRepository(db))
    try:
        user = service.get_by_email(email)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return UserPublic.model_validate(user)

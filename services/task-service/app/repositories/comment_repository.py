from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task_comment import TaskComment
from app.schemas.comment import CommentCreate, CommentUpdate


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_task(self, task_id: UUID) -> list[TaskComment]:
        stmt = (
            select(TaskComment)
            .where(TaskComment.task_id == task_id)
            .order_by(TaskComment.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_by_id(self, comment_id: UUID) -> TaskComment | None:
        return self.db.get(TaskComment, comment_id)

    def create(
        self,
        task_id: UUID,
        author_id: UUID,
        data: CommentCreate,
        mentioned_user_ids: list[UUID],
    ) -> TaskComment:
        comment = TaskComment(
            task_id=task_id,
            author_id=author_id,
            body=data.body.strip(),
            mentioned_user_ids=[str(uid) for uid in mentioned_user_ids],
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def update(self, comment: TaskComment, data: CommentUpdate, mentioned_user_ids: list[UUID]) -> TaskComment:
        comment.body = data.body.strip()
        comment.mentioned_user_ids = [str(uid) for uid in mentioned_user_ids]
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete(self, comment: TaskComment) -> None:
        self.db.delete(comment)
        self.db.commit()

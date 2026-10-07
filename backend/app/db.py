"""SQLite storage via SQLAlchemy 2.0 (sync). One file DB, WAL for concurrency."""
from __future__ import annotations

import os
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    event,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DB_PATH = os.environ.get("PARTNER_DB_PATH", "/data/partner.db")
# Ensure the directory exists when a nested path is given (e.g. /data).
_dir = os.path.dirname(DB_PATH)
if _dir:
    os.makedirs(_dir, exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _record):  # noqa: ANN001
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # Short human code embedded (encrypted) into every QR, e.g. "BKF-1".
    key: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    free_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    checks: Mapped[list["Check"]] = relationship(
        back_populates="partner", cascade="all, delete-orphan"
    )


class Check(Base):
    __tablename__ = "checks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    partner_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("partners.id", ondelete="CASCADE"), index=True
    )
    plate: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    # Encrypted QR token ("AP1.<base64url…>") — comfortably longer than 64.
    code: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    partner: Mapped[Partner] = relationship(back_populates="checks")


def init_db() -> None:
    Base.metadata.create_all(engine)
    _migrate_add_key()


def _migrate_add_key() -> None:
    """Add partners.key to a pre-existing DB (SQLite lightweight migration)."""
    from sqlalchemy import text

    with engine.begin() as conn:
        cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(partners)").fetchall()]
        if "key" not in cols:
            conn.exec_driver_sql("ALTER TABLE partners ADD COLUMN key VARCHAR(32)")
            # Backfill a code from the id for any legacy rows, keep it unique.
            for row in conn.exec_driver_sql("SELECT id FROM partners WHERE key IS NULL").fetchall():
                conn.execute(
                    text("UPDATE partners SET key = :k WHERE id = :id"),
                    {"k": f"P-{row[0][:6].upper()}", "id": row[0]},
                )

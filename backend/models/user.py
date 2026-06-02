from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="analyst")  # analyst / admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    screener_email = Column(String(200))
    screener_session = Column(Text)   # JSON-encoded {sessionid, csrftoken}
    tab_permissions = Column(Text, nullable=True)  # JSON-encoded list; null = use role defaults

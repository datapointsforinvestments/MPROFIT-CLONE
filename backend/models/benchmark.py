from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from database import Base


class BenchmarkIndex(Base):
    __tablename__ = "benchmark_indices"

    id           = Column(Integer, primary_key=True)
    label        = Column(String(100), nullable=False)
    yahoo_symbol = Column(String(50), nullable=False, unique=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

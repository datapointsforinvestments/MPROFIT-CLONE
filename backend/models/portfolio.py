from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from database import Base


class Folio(Base):
    __tablename__ = "portfolio_folios"

    id         = Column(Integer, primary_key=True)
    name       = Column(String(100), nullable=False, unique=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PortfolioAsset(Base):
    __tablename__ = "portfolio_assets"

    id         = Column(Integer, primary_key=True)
    symbol     = Column(String(30), unique=True, nullable=False)
    isin       = Column(String(12))
    name       = Column(String(200), nullable=False)
    sector     = Column(String(100), default="Unknown")
    industry   = Column(String(100))
    exchange   = Column(String(10), default="NSE")
    created_at = Column(DateTime, default=datetime.utcnow)


class PortfolioTransaction(Base):
    __tablename__ = "portfolio_transactions"

    id           = Column(Integer, primary_key=True)
    folio_id     = Column(Integer, ForeignKey("portfolio_folios.id"), nullable=False)
    asset_id     = Column(Integer, ForeignKey("portfolio_assets.id"), nullable=False)
    trade_date   = Column(Date, nullable=False)
    trans_type   = Column(String(20), nullable=False)  # Buy/Sell/Bonus/Split/Dividend
    quantity     = Column(Numeric(18, 4), default=0)
    price        = Column(Numeric(18, 4), default=0)
    total_amount = Column(Numeric(18, 2), default=0)
    split_ratio  = Column(Numeric(10, 4))
    brokerage    = Column(Numeric(12, 2), default=0)
    notes        = Column(Text)
    created_by   = Column(String(100))
    created_at   = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("folio_id", "asset_id", "trade_date", "trans_type", "quantity", "price"),
    )


class PortfolioQuote(Base):
    __tablename__ = "portfolio_quotes"

    asset_id        = Column(Integer, ForeignKey("portfolio_assets.id"), primary_key=True)
    cmp             = Column(Numeric(14, 4))
    prev_close      = Column(Numeric(14, 4))
    day_change_pct  = Column(Numeric(8, 4))
    week52_high     = Column(Numeric(14, 4))
    week52_low      = Column(Numeric(14, 4))
    market_cap_cr   = Column(Numeric(18, 2))   # market cap in INR crores
    pct_change_1y   = Column(Numeric(8, 4))    # 52-week % change
    fetched_at      = Column(DateTime, default=datetime.utcnow)


class PortfolioSymbolMapping(Base):
    __tablename__ = "portfolio_symbol_mappings"

    id        = Column(Integer, primary_key=True)
    raw_name  = Column(String(300), nullable=False)
    norm_name = Column(String(300), unique=True, nullable=False)
    symbol    = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

"""
Price fetcher service — pulls live market data from Yahoo Finance via yfinance.
NSE ticker format: SBIN.NS, INFY.NS, PIIND.NS etc.
"""
import yfinance as yf
from typing import Optional
from sqlalchemy.orm import Session
from models.company import Company
from models.market_data import MarketData
import logging

logger = logging.getLogger(__name__)


def _fetch_ticker_data(ticker: str) -> Optional[dict]:
    """Fetch a single ticker's data from Yahoo Finance."""
    try:
        t = yf.Ticker(ticker)
        info = t.info
        if not info or info.get("regularMarketPrice") is None and info.get("currentPrice") is None:
            return None

        cmp = info.get("currentPrice") or info.get("regularMarketPrice")
        mcap = info.get("marketCap")
        mcap_cr = round(mcap / 10_000_000, 2) if mcap else None

        day_change_pct = info.get("regularMarketChangePercent")
        if day_change_pct is None:
            prev = info.get("regularMarketPreviousClose")
            change = info.get("regularMarketChange")
            if prev and change and prev > 0:
                day_change_pct = round(change / prev * 100, 2)

        return {
            "cmp": cmp,
            "mcap_cr": mcap_cr,
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "ps_ratio": info.get("priceToSalesTrailing12Months"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "day_change_pct": day_change_pct,
            "volume": info.get("volume"),
        }
    except Exception as e:
        logger.error(f"Error fetching {ticker}: {e}")
        return None


def fetch_company_price(db: Session, company_id: int) -> Optional[MarketData]:
    """Fetch and store price for a single company."""
    company = db.query(Company).filter(Company.id == company_id, Company.is_active == True).first()
    if not company or not company.nse_ticker:
        return None

    data = _fetch_ticker_data(company.nse_ticker)
    if not data:
        return None

    md = MarketData(company_id=company_id, source="yfinance", **{k: v for k, v in data.items() if v is not None})
    db.add(md)
    db.commit()
    db.refresh(md)
    return md


def fetch_all_prices(db: Session) -> dict:
    """Fetch prices for all active companies with NSE tickers."""
    companies = db.query(Company).filter(Company.is_active == True, Company.nse_ticker.isnot(None)).all()
    results = {"success": 0, "failed": 0, "skipped": 0}

    for company in companies:
        data = _fetch_ticker_data(company.nse_ticker)
        if data:
            md = MarketData(
                company_id=company.id,
                source="yfinance",
                **{k: v for k, v in data.items() if v is not None}
            )
            db.add(md)
            results["success"] += 1
        else:
            results["failed"] += 1

    db.commit()
    return results


def get_latest_price(db: Session, company_id: int) -> Optional[MarketData]:
    """Get the most recent market data row for a company."""
    return (
        db.query(MarketData)
        .filter(MarketData.company_id == company_id)
        .order_by(MarketData.fetched_at.desc())
        .first()
    )

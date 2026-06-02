from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    model_type: str = "normal"
    analyst: Optional[str] = None
    co_analyst: Optional[str] = None
    reco: Optional[str] = None
    priority: Optional[int] = None
    nse_ticker: Optional[str] = None
    promoter_pct: Optional[float] = None
    screener_url: Optional[str] = None
    sharepoint_url: Optional[str] = None
    thesis: Optional[str] = None
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    fincode: int


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    analyst: Optional[str] = None
    co_analyst: Optional[str] = None
    reco: Optional[str] = None
    priority: Optional[int] = None
    nse_ticker: Optional[str] = None
    promoter_pct: Optional[float] = None
    screener_url: Optional[str] = None
    sharepoint_url: Optional[str] = None
    thesis: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    reco_date: Optional[datetime] = None


class CompanyOut(CompanyBase):
    id: int
    fincode: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None
    thesis_file_name: Optional[str] = None
    reco_date: Optional[datetime] = None
    reco_updated_by: Optional[str] = None

    model_config = {"from_attributes": True}


class CompanyWithMarket(CompanyOut):
    cmp: Optional[float] = None
    mcap_cr: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    intrinsic_value: Optional[float] = None
    upside_pct: Optional[float] = None
    implied_growth_pct: Optional[float] = None
    sales_growth_pct: Optional[float] = None
    market_data_at: Optional[datetime] = None

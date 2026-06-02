from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DCFAssumptionOut(BaseModel):
    id: int
    company_id: int
    model_type: Optional[str] = None
    wacc_pct: Optional[float] = None
    tgr_pct: Optional[float] = None
    exit_pe: Optional[float] = None
    sales_growth_pct: Optional[float] = None
    normalised_pbt_margin: Optional[float] = None
    tax_rate_pct: Optional[float] = None
    wc_days: Optional[float] = None
    net_cash: Optional[float] = None
    capital_turnover: Optional[float] = None
    analyst_target_price: Optional[float] = None
    nim_pct: Optional[float] = None
    credit_cost_pct: Optional[float] = None
    aum_growth_pct: Optional[float] = None
    cost_income_pct_nbfc: Optional[float] = None
    target_roe_pct: Optional[float] = None
    cost_of_equity_pct: Optional[float] = None
    advances_growth_pct: Optional[float] = None
    dividend_payout_pct: Optional[float] = None
    dps_override: Optional[float] = None
    intrinsic_value: Optional[float] = None
    implied_growth_pct: Optional[float] = None
    iv_method: Optional[str] = None
    is_seeded: Optional[bool] = None
    seed_notes: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DCFAssumptionUpdate(BaseModel):
    wacc_pct: Optional[float] = None
    tgr_pct: Optional[float] = None
    exit_pe: Optional[float] = None
    sales_growth_pct: Optional[float] = None
    normalised_pbt_margin: Optional[float] = None
    tax_rate_pct: Optional[float] = None
    wc_days: Optional[float] = None
    net_cash: Optional[float] = None
    capital_turnover: Optional[float] = None
    analyst_target_price: Optional[float] = None
    nim_pct: Optional[float] = None
    credit_cost_pct: Optional[float] = None
    aum_growth_pct: Optional[float] = None
    cost_income_pct_nbfc: Optional[float] = None
    target_roe_pct: Optional[float] = None
    cost_of_equity_pct: Optional[float] = None
    advances_growth_pct: Optional[float] = None
    dividend_payout_pct: Optional[float] = None
    dps_override: Optional[float] = None
    iv_method: Optional[str] = None

from pydantic import BaseModel
from typing import Optional, List


class AnnualFinancialOut(BaseModel):
    id: int
    company_id: int
    fy_year: int
    model_type: Optional[str] = None

    # ── Normal P&L ────────────────────────────────────────────────────────────
    net_sales: Optional[float] = None
    gross_sales: Optional[float] = None
    raw_material: Optional[float] = None
    employee_cost: Optional[float] = None
    power_fuel: Optional[float] = None
    other_opex: Optional[float] = None
    admin_expenses: Optional[float] = None
    selling_expenses: Optional[float] = None
    rd_expenses: Optional[float] = None
    total_expenditure: Optional[float] = None
    ebitda: Optional[float] = None
    other_income: Optional[float] = None
    ebit_incl_oi: Optional[float] = None
    interest: Optional[float] = None
    depreciation: Optional[float] = None
    pbt: Optional[float] = None
    exceptional_items: Optional[float] = None
    tax: Optional[float] = None
    pat: Optional[float] = None
    consolidated_pat: Optional[float] = None
    eps: Optional[float] = None
    dividend_pct: Optional[float] = None

    # ── Bank P&L ──────────────────────────────────────────────────────────────
    interest_earned: Optional[float] = None
    interest_on_advances: Optional[float] = None
    income_on_investments: Optional[float] = None
    other_income_bank: Optional[float] = None
    total_income_bank: Optional[float] = None
    interest_expended: Optional[float] = None
    interest_on_deposits: Optional[float] = None
    operating_expenses: Optional[float] = None
    provisions: Optional[float] = None
    ppop: Optional[float] = None

    # ── Balance Sheet ─────────────────────────────────────────────────────────
    share_capital: Optional[float] = None
    reserves: Optional[float] = None
    networth: Optional[float] = None
    lt_debt: Optional[float] = None
    st_borrowings: Optional[float] = None
    total_debt: Optional[float] = None
    trade_payables: Optional[float] = None
    total_current_liab: Optional[float] = None
    total_liabilities: Optional[float] = None
    gross_block: Optional[float] = None
    acc_depreciation: Optional[float] = None
    net_block: Optional[float] = None
    cwip: Optional[float] = None
    investments: Optional[float] = None
    inventory: Optional[float] = None
    debtors: Optional[float] = None
    cash_bank: Optional[float] = None
    total_current_assets: Optional[float] = None
    total_assets: Optional[float] = None

    # ── Bank BS extras ────────────────────────────────────────────────────────
    deposits: Optional[float] = None
    borrowings: Optional[float] = None
    advances: Optional[float] = None
    cash_rbi: Optional[float] = None
    fixed_assets: Optional[float] = None
    other_assets: Optional[float] = None

    # ── NBFC BS extras ────────────────────────────────────────────────────────
    loans_advances: Optional[float] = None

    # ── Cash Flow ─────────────────────────────────────────────────────────────
    cfo: Optional[float] = None
    cfi: Optional[float] = None
    cff: Optional[float] = None
    capex: Optional[float] = None
    fcf: Optional[float] = None
    closing_cash: Optional[float] = None

    # ── Derived Ratios ────────────────────────────────────────────────────────
    ebitda_margin: Optional[float] = None
    pbt_margin: Optional[float] = None
    pat_margin: Optional[float] = None
    roe_pct: Optional[float] = None
    roa_pct: Optional[float] = None
    roce_pct: Optional[float] = None
    debtor_days: Optional[float] = None
    inventory_days: Optional[float] = None
    payable_days: Optional[float] = None
    cash_conversion_cycle: Optional[float] = None
    debt_equity: Optional[float] = None

    # ── Bank/NBFC metrics ────────────────────────────────────────────────────
    nim_pct: Optional[float] = None
    yield_on_advances: Optional[float] = None
    gnpa_pct: Optional[float] = None
    nnpa_pct: Optional[float] = None
    pcr_pct: Optional[float] = None
    cost_income_pct: Optional[float] = None
    credit_cost_pct: Optional[float] = None
    car_tier1: Optional[float] = None
    car_total: Optional[float] = None
    casa_pct: Optional[float] = None

    model_config = {"from_attributes": True}


class QuarterlyFinancialOut(BaseModel):
    id: int
    company_id: int
    quarter: str
    fy_year: Optional[int] = None
    quarter_num: Optional[int] = None
    net_sales: Optional[float] = None
    ebitda: Optional[float] = None
    ebitda_margin: Optional[float] = None
    pat: Optional[float] = None
    pat_margin: Optional[float] = None
    eps: Optional[float] = None
    nii: Optional[float] = None
    nim_pct: Optional[float] = None
    gnpa_pct: Optional[float] = None
    nnpa_pct: Optional[float] = None
    roa_pct: Optional[float] = None
    ppop: Optional[float] = None
    provisions: Optional[float] = None

    model_config = {"from_attributes": True}

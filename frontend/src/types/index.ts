// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  full_name: string | null
  role: 'admin' | 'fm' | 'analyst'
  is_active: boolean
  created_at: string | null
  tab_permissions: string[] | null
}

// ─── Document Repository ──────────────────────────────────────────────────────

export interface CompanyDocument {
  id: number
  company_name: string
  file_name: string
  file_size_kb: number | null
  document_date: string | null
  notes: string | null
  uploaded_by: string | null
  uploaded_at: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// ─── Company ──────────────────────────────────────────────────────────────────

export type ModelType = 'normal' | 'bank' | 'nbfc'
export type Reco = 'Buy' | 'Hold' | 'Sell' | 'Watch' | null

export interface Company {
  id: number
  fincode: number
  name: string
  short_name: string | null
  sector: string | null
  industry: string | null
  size: string | null
  model_type: ModelType
  analyst: string | null
  co_analyst: string | null
  reco: Reco
  priority: number | null
  nse_ticker: string | null
  promoter_pct: number | null
  screener_url: string | null
  sharepoint_url: string | null
  thesis: string | null
  notes: string | null
  thesis_file_name: string | null
  thesis_uploaded_at: string | null
  reco_date: string | null
  reco_updated_by: string | null
  is_active: boolean
  created_at: string | null
  created_by: string | null
}

export interface DashboardRow extends Company {
  cmp: number | null
  day_change_pct: number | null
  week_52_high: number | null
  week_52_low: number | null
  up_from_52w_low: number | null
  dn_from_52w_high: number | null
  mcap_cr: number | null
  pe_ratio: number | null
  pb_ratio: number | null
  ps_ratio: number | null
  market_data_at: string | null
  intrinsic_value: number | null
  upside_pct: number | null
  implied_growth_pct: number | null
  analyst_growth_pct: number | null
  analyst_target_price: number | null
  premium_discount: number | null
  ttm_sales: number | null
  ttm_pat: number | null
  sales_growth_yoy: number | null
  roe_pct: number | null
  pat_margin: number | null
  latest_fy: number | null
  has_financials: boolean
  has_market_data: boolean
  dcf_updated_at: string | null
  thesis_uploaded_at: string | null
}

// ─── Financials ───────────────────────────────────────────────────────────────

export interface AnnualFinancial {
  id: number
  company_id: number
  fy_year: number
  model_type: string | null

  // Normal P&L
  net_sales: number | null
  gross_sales: number | null
  raw_material: number | null
  employee_cost: number | null
  power_fuel: number | null
  other_opex: number | null
  admin_expenses: number | null
  selling_expenses: number | null
  rd_expenses: number | null
  total_expenditure: number | null
  ebitda: number | null
  other_income: number | null
  ebit_incl_oi: number | null
  interest: number | null
  depreciation: number | null
  pbt: number | null
  exceptional_items: number | null
  tax: number | null
  pat: number | null
  consolidated_pat: number | null
  eps: number | null
  dividend_pct: number | null

  // Bank P&L
  interest_earned: number | null
  interest_on_advances: number | null
  income_on_investments: number | null
  other_income_bank: number | null
  total_income_bank: number | null
  interest_expended: number | null
  interest_on_deposits: number | null
  operating_expenses: number | null
  provisions: number | null
  ppop: number | null

  // Balance Sheet
  share_capital: number | null
  reserves: number | null
  networth: number | null
  lt_debt: number | null
  st_borrowings: number | null
  total_debt: number | null
  trade_payables: number | null
  total_current_liab: number | null
  total_liabilities: number | null
  gross_block: number | null
  acc_depreciation: number | null
  net_block: number | null
  cwip: number | null
  investments: number | null
  inventory: number | null
  debtors: number | null
  cash_bank: number | null
  total_current_assets: number | null
  total_assets: number | null

  // Bank BS
  deposits: number | null
  borrowings: number | null
  advances: number | null
  cash_rbi: number | null
  fixed_assets: number | null
  other_assets: number | null

  // NBFC BS
  loans_advances: number | null

  // Cash Flow
  cfo: number | null
  cfi: number | null
  cff: number | null
  capex: number | null
  fcf: number | null
  closing_cash: number | null

  // Ratios
  ebitda_margin: number | null
  pbt_margin: number | null
  pat_margin: number | null
  roe_pct: number | null
  roa_pct: number | null
  roce_pct: number | null
  debtor_days: number | null
  inventory_days: number | null
  payable_days: number | null
  cash_conversion_cycle: number | null
  debt_equity: number | null

  // Bank/NBFC
  nim_pct: number | null
  yield_on_advances: number | null
  gnpa_pct: number | null
  nnpa_pct: number | null
  pcr_pct: number | null
  cost_income_pct: number | null
  credit_cost_pct: number | null
  car_tier1: number | null
  car_total: number | null
  casa_pct: number | null
}

export interface QuarterlyFinancial {
  id: number
  company_id: number
  quarter: string
  fy_year: number | null
  quarter_num: number | null
  net_sales: number | null
  ebitda: number | null
  ebitda_margin: number | null
  pat: number | null
  pat_margin: number | null
  eps: number | null
  nii: number | null
  nim_pct: number | null
  gnpa_pct: number | null
  nnpa_pct: number | null
  roa_pct: number | null
  ppop: number | null
  provisions: number | null
}

// ─── DCF ──────────────────────────────────────────────────────────────────────

export interface DCFAssumption {
  id: number
  company_id: number
  model_type: string | null
  wacc_pct: number | null
  tgr_pct: number | null
  exit_pe: number | null
  sales_growth_pct: number | null
  normalised_pbt_margin: number | null
  tax_rate_pct: number | null
  wc_days: number | null
  net_cash: number | null
  capital_turnover: number | null
  analyst_target_price: number | null
  nim_pct: number | null
  credit_cost_pct: number | null
  aum_growth_pct: number | null
  cost_income_pct_nbfc: number | null
  target_roe_pct: number | null
  cost_of_equity_pct: number | null
  advances_growth_pct: number | null
  dividend_payout_pct: number | null
  dps_override: number | null
  intrinsic_value: number | null
  implied_growth_pct: number | null
  iv_method: string | null
  is_seeded: boolean | null
  seed_notes: string | null
  updated_by: string | null
  updated_at: string | null
}

export interface DCFProjectionRow {
  year: string
  sales: number
  pbt: number
  nopat: number
  fcf: number
  pv: number
  cumulative_pv: number
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KPIEntry {
  id: number
  company_id: number
  kpi_name: string
  kpi_value: number | null
  period: string | null
  kpi_type: number | null
  entered_by: string | null
  entered_at: string | null
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadPreview {
  company_name: string | null
  fincode: number | null
  mode: 'created' | 'updated'
  model_type: string
  years_found: string[]
  total_years: number
  fields_extracted: number
  dcf_seeded: boolean
  dcf_seed_values: Record<string, number>
  warnings: string[]
  errors: string[]
  parse_token: string | null
}

export interface UploadRecord {
  id: number
  company_id: number | null
  filename: string | null
  uploaded_by: string | null
  uploaded_at: string | null
  status: string | null
  years_imported: number | null
  errors: string | null
  quarter: string | null
  model_type: string | null
  stored_path: string | null
}

// ─── Portfolio Tracker ────────────────────────────────────────────────────────

export interface Folio {
  id: number
  name: string
  is_active: boolean
}

export interface HoldingRow {
  folio_id: number
  folio_name: string
  folio_names?: string      // comma-joined in consolidated view
  asset_id: number
  symbol: string
  asset_name: string
  sector: string
  net_qty: number
  avg_price: number
  total_investment: number
  cmp: number | null
  current_value: number | null
  unrealised_pnl: number | null
  unrealised_pnl_pct: number | null
  realised_pnl: number
  realised_pnl_pct: number
  xirr_pct: number | null
  cagr_pct: number | null
  total_dividend: number
  trailing_div: number
  div_xirr_pct: number | null
  first_purchase_date: string | null
  last_exit_date: string | null
  is_exited: boolean
  day_change_pct: number | null
  portfolio_pct: number
}

export interface FolioSummary {
  folio_id: number
  folio_name: string
  total_investment: number
  current_value: number
  total_gain: number
  total_gain_pct: number
  xirr_pct: number | null
  cagr_pct: number | null
  div_xirr_pct: number | null
  total_dividend: number
  trailing_12m_dividend: number
  holdings: HoldingRow[]
}

export interface DividendRecord {
  id: number
  folio_id: number
  folio_name: string
  asset_id: number
  symbol: string
  asset_name: string
  ex_date: string
  dividend_per_share: number
  qty_held: number
  total_received: number
}

export interface DividendTotals {
  total_all_time: number
  trailing_12m: number
  last_sync: string | null
  by_stock: { symbol: string; asset_name: string; total: number; trailing_12m: number }[]
}

export interface ConsolidatedSummary extends FolioSummary {
  consolidated: boolean
  folios: FolioSummary[]
}

export interface PLTransactionRow {
  symbol: string
  asset_name: string
  folio_name: string
  buy_date: string
  sell_date: string
  quantity: number
  buy_price: number
  sell_price: number
  buy_amount: number
  sell_amount: number
  gain_loss: number
  gain_loss_pct: number
  holding_days: number
  tax_category: 'STCG' | 'LTCG'
}

export interface PLReportEntry {
  folio_name: string
  symbol: string
  asset_name: string
  realised_stcg: number
  realised_ltcg: number
  total_realised: number
  transactions: PLTransactionRow[]
}

export interface PLReport {
  summary: { total_stcg: number; total_ltcg: number; total_realised: number }
  reports: PLReportEntry[]
}

export interface PortfolioTransaction {
  id: number
  folio_id: number
  folio_name: string
  asset_id: number
  symbol: string
  asset_name: string
  trade_date: string
  trans_type: string
  quantity: number
  price: number
  total_amount: number
  brokerage: number
  notes: string | null
  created_by: string | null
}

export interface SymbolMapping {
  id: number
  raw_name: string
  norm_name: string
  symbol: string
}

export interface ReconcileRow {
  symbol: string
  demat_qty: number
  book_qty: number
  difference: number
  status: 'OK' | 'DEMAT_EXCESS' | 'BOOK_EXCESS'
}

export interface UploadResult {
  rows_processed: number
  rows_successful: number
  rows_failed: number
  rows_duplicate: number
  errors: string[]
  unmapped_names: string[]
}

// ─── Industry Tags ────────────────────────────────────────────────────────────

export interface IndustryTag {
  id: number
  name: string
}

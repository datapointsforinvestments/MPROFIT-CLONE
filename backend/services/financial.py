"""
financial.py — XIRR, CAGR, FIFO P&L engine.
Pure-Python — no scipy/C-compiler required.
"""
from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional, Tuple


# ── XIRR (pure Python — Brent's method) ──────────────────────────────────────
def _xnpv(rate: float, cashflows: List[Tuple[date, float]]) -> float:
    t0 = cashflows[0][0]
    return sum(cf / (1 + rate) ** ((d - t0).days / 365.0) for d, cf in cashflows)


def _brentq(f, a: float, b: float, tol: float = 1e-8, maxiter: int = 1000) -> float:
    fa, fb = f(a), f(b)
    if fa * fb > 0:
        raise ValueError("Root not bracketed")
    if abs(fa) < abs(fb):
        a, b, fa, fb = b, a, fb, fa
    c, fc = a, fa
    mflag = True
    s = d = 0.0
    for _ in range(maxiter):
        if abs(b - a) < tol:
            break
        if fa != fc and fb != fc:
            s = (a * fb * fc / ((fa - fb) * (fa - fc))
                 + b * fa * fc / ((fb - fa) * (fb - fc))
                 + c * fa * fb / ((fc - fa) * (fc - fb)))
        else:
            s = b - fb * (b - a) / (fb - fa)
        cond1 = not ((3 * a + b) / 4 < s < b or b < s < (3 * a + b) / 4)
        cond2 = mflag and abs(s - b) >= abs(b - c) / 2
        cond3 = not mflag and abs(s - b) >= abs(c - d) / 2
        cond4 = mflag and abs(b - c) < tol
        cond5 = not mflag and abs(c - d) < tol
        if cond1 or cond2 or cond3 or cond4 or cond5:
            s = (a + b) / 2
            mflag = True
        else:
            mflag = False
        fs = f(s)
        d, c, fc = c, b, fb
        if fa * fs < 0:
            b, fb = s, fs
        else:
            a, fa = s, fs
        if abs(fa) < abs(fb):
            a, b, fa, fb = b, a, fb, fa
    return b


def xirr(cashflows: List[Tuple[date, float]]) -> Optional[float]:
    """Returns XIRR as a percentage (e.g. 14.2) or None."""
    if not cashflows or len(cashflows) < 2:
        return None
    if not [c for _, c in cashflows if c > 0]:
        return None
    if not [c for _, c in cashflows if c < 0]:
        return None
    try:
        result = _brentq(lambda r: _xnpv(r, cashflows), -0.999, 100.0)
        return round(result * 100, 4)
    except (ValueError, RuntimeError):
        return None


# ── CAGR ──────────────────────────────────────────────────────────────────────
def cagr(invested: float, current_value: float, start_date: date,
         end_date: Optional[date] = None) -> Optional[float]:
    """Returns CAGR as a percentage or None."""
    if not invested or invested <= 0:
        return None
    end = end_date or date.today()
    years = (end - start_date).days / 365.25
    if years <= 0:
        return None
    return round(((current_value / invested) ** (1 / years) - 1) * 100, 4)


def abs_return_pct(invested: float, current: float) -> Optional[float]:
    if not invested:
        return None
    return round((current - invested) / invested * 100, 4)


# ── FIFO Engine ───────────────────────────────────────────────────────────────
class FIFOLot:
    __slots__ = ("trade_date", "qty", "price", "amount")

    def __init__(self, trade_date, qty, price, amount):
        self.trade_date = trade_date
        self.qty = qty
        self.price = price
        self.amount = amount


class FIFOResult:
    def __init__(self):
        self.stcg = 0.0
        self.ltcg = 0.0
        self.rows = []

    @property
    def total(self):
        return self.stcg + self.ltcg


def fifo_pnl(transactions: list, symbol: str, asset_name: str, folio_name: str) -> FIFOResult:
    """
    FIFO realised P&L. STCG = ≤365 days, LTCG = >365 days (Indian equity).
    Bonus/Split adjust lots without changing cost basis.
    """
    lots = []
    result = FIFOResult()

    for txn in sorted(transactions, key=lambda x: x["trade_date"]):
        ttype = txn["trans_type"]
        qty   = float(txn["quantity"])
        price = float(txn["price"])
        amt   = float(txn["total_amount"])
        tdate = txn["trade_date"]

        if ttype == "Buy":
            lots.append(FIFOLot(tdate, qty, price, amt))

        elif ttype == "Sell":
            rem = qty
            proceeds = amt if amt > 0 else qty * price
            while rem > 0.0001 and lots:
                lot  = lots[0]
                mq   = min(lot.qty, rem)
                cost = (mq / lot.qty) * lot.amount
                pr   = (mq / qty) * proceeds
                gain = pr - cost
                hd   = (tdate - lot.trade_date).days
                tc   = "LTCG" if hd > 365 else "STCG"
                if tc == "STCG":
                    result.stcg += gain
                else:
                    result.ltcg += gain
                result.rows.append({
                    "symbol": symbol, "asset_name": asset_name, "folio_name": folio_name,
                    "buy_date": lot.trade_date, "sell_date": tdate, "quantity": mq,
                    "buy_price": lot.price, "sell_price": price,
                    "buy_amount": cost, "sell_amount": pr,
                    "gain_loss": round(gain, 2),
                    "gain_loss_pct": round((gain / cost * 100) if cost else 0, 4),
                    "holding_days": hd, "tax_category": tc,
                })
                lot.qty    -= mq
                lot.amount -= cost
                rem        -= mq
                if lot.qty < 0.0001:
                    lots.pop(0)

        elif ttype == "Bonus":
            lots.append(FIFOLot(tdate, qty, 0.0, 0.0))

        elif ttype == "Split":
            ratio = float(txn.get("split_ratio") or 1)
            if ratio > 0:
                for lot in lots:
                    lot.qty   *= ratio
                    lot.price /= ratio

    result.stcg = round(result.stcg, 2)
    result.ltcg = round(result.ltcg, 2)
    return result


def compute_avg_price_and_qty(transactions: list):
    """Returns (total_qty, avg_price, total_investment) after corporate actions."""
    total_investment = 0.0
    total_qty = 0.0
    lots = []

    for txn in sorted(transactions, key=lambda x: x["trade_date"]):
        ttype = txn["trans_type"]
        qty   = float(txn["quantity"])
        amt   = float(txn["total_amount"])
        tdate = txn["trade_date"]

        if ttype == "Buy":
            total_qty += qty
            total_investment += amt
            lots.append(FIFOLot(tdate, qty, float(txn["price"]), amt))

        elif ttype == "Sell":
            rem = qty
            while rem > 0.0001 and lots:
                lot  = lots[0]
                mq   = min(lot.qty, rem)
                cost = (mq / lot.qty) * lot.amount
                total_qty        -= mq
                total_investment -= cost
                lot.qty    -= mq
                lot.amount -= cost
                rem        -= mq
                if lot.qty < 0.0001:
                    lots.pop(0)

        elif ttype == "Bonus":
            total_qty += qty
            lots.append(FIFOLot(tdate, qty, 0.0, 0.0))

        elif ttype == "Split":
            ratio = float(txn.get("split_ratio") or 1)
            total_qty *= ratio
            for lot in lots:
                lot.qty   *= ratio
                lot.price /= ratio

    avg_price = (total_investment / total_qty) if total_qty > 0.0001 else 0.0
    return round(total_qty, 4), round(avg_price, 4), round(total_investment, 2)


def build_xirr_cashflows(transactions: list, current_value: float, today=None):
    """Build XIRR cashflow list: buys = outflow(-), sells/current = inflow(+)."""
    today = today or date.today()
    cfs = []

    for txn in transactions:
        ttype = txn["trans_type"]
        amt   = float(txn["total_amount"])
        td    = txn["trade_date"]
        if isinstance(td, datetime):
            td = td.date()
        if ttype == "Buy":
            cfs.append((td, -amt))
        elif ttype == "Sell":
            cfs.append((td, amt))

    if current_value > 0:
        cfs.append((today, current_value))

    cfs.sort(key=lambda x: x[0])
    return cfs

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Transaction
from services.price_service import get_asset_price
from services.agent_service import compute_portfolio_metrics

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary")
def get_portfolio_summary(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    prices = {}
    for tx in transactions:
        if tx.ticker not in prices:
            price = get_asset_price(tx.ticker, tx.asset_type)
            if price:
                prices[tx.ticker] = price

    metrics = compute_portfolio_metrics(transactions, prices)

    holdings_out = []
    for h in metrics["holdings"]:
        holdings_out.append({
            "ticker": h["ticker"],
            "name": h["name"],
            "asset_type": h["asset_type"],
            "quantity": round(h["quantity"], 6),
            "avg_cost": round(h["avg_cost"], 4),
            "current_price": round(h["current_price"], 4),
            "current_value": round(h["current_value"], 2),
            "total_invested": round(h["total_invested"], 2),
            "pnl": round(h["pnl"], 2),
            "pnl_pct": round(h["pnl_pct"], 2),
            "weight": round(h["weight"], 2),
        })

    return {
        "holdings": holdings_out,
        "total_value": round(metrics["total_value"], 2),
        "total_invested": round(metrics["total_invested"], 2),
        "total_pnl": round(metrics["total_pnl"], 2),
        "total_pnl_pct": round(metrics["total_pnl_pct"], 2),
    }


@router.get("/allocation")
def get_allocation(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    prices = {}
    for tx in transactions:
        if tx.ticker not in prices:
            price = get_asset_price(tx.ticker, tx.asset_type)
            if price:
                prices[tx.ticker] = price

    metrics = compute_portfolio_metrics(transactions, prices)
    total = metrics["total_value"]

    type_data: dict[str, float] = {}
    for h in metrics["holdings"]:
        t = h["asset_type"]
        type_data[t] = type_data.get(t, 0) + h["current_value"]

    return {
        "by_type": [
            {
                "name": k.upper(),
                "value": round(v, 2),
                "percentage": round(v / total * 100, 2) if total > 0 else 0,
            }
            for k, v in type_data.items()
        ],
        "by_asset": [
            {
                "ticker": h["ticker"],
                "name": h["name"],
                "value": round(h["current_value"], 2),
                "percentage": round(h["weight"], 2),
            }
            for h in sorted(metrics["holdings"], key=lambda x: x["current_value"], reverse=True)
        ],
    }

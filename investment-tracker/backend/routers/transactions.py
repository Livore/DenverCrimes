from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db, Transaction
from services.price_service import get_asset_price

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    asset_type: str  # stock, etf, crypto
    ticker: str
    name: str
    quantity: float
    price: float
    transaction_type: str  # buy, sell
    date: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
def list_transactions(db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.date.desc()).all()
    return [
        {
            "id": tx.id,
            "asset_type": tx.asset_type,
            "ticker": tx.ticker,
            "name": tx.name,
            "quantity": tx.quantity,
            "price": tx.price,
            "total_value": tx.total_value,
            "transaction_type": tx.transaction_type,
            "date": tx.date.isoformat(),
            "notes": tx.notes,
        }
        for tx in txs
    ]


@router.post("/")
def add_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    tx_date = datetime.now()
    if tx.date:
        try:
            tx_date = datetime.fromisoformat(tx.date)
        except ValueError:
            pass

    db_tx = Transaction(
        asset_type=tx.asset_type.lower(),
        ticker=tx.ticker.upper(),
        name=tx.name,
        quantity=tx.quantity,
        price=tx.price,
        total_value=tx.quantity * tx.price,
        transaction_type=tx.transaction_type.lower(),
        date=tx_date,
        notes=tx.notes,
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return {"id": db_tx.id, "message": "Transazione aggiunta con successo"}


@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    db.delete(tx)
    db.commit()
    return {"message": "Transazione eliminata"}


@router.get("/price/{asset_type}/{ticker}")
def get_price(asset_type: str, ticker: str):
    price = get_asset_price(ticker.upper(), asset_type.lower())
    if price is None:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")
    return {"ticker": ticker.upper(), "price": price}

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import db, doc_to_transaction
from services.price_service import get_asset_price

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    asset_type: str
    ticker: str
    name: str
    quantity: float
    price: float
    transaction_type: str
    date: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
def list_transactions():
    docs = db.collection("transactions").order_by("date", direction="DESCENDING").get()
    result = []
    for doc in docs:
        tx = doc_to_transaction(doc)
        result.append({
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
        })
    return result


@router.post("/")
def add_transaction(tx: TransactionCreate):
    tx_date = datetime.now()
    if tx.date:
        try:
            tx_date = datetime.fromisoformat(tx.date)
        except ValueError:
            pass

    _, doc_ref = db.collection("transactions").add({
        "asset_type": tx.asset_type.lower(),
        "ticker": tx.ticker.upper(),
        "name": tx.name,
        "quantity": tx.quantity,
        "price": tx.price,
        "total_value": tx.quantity * tx.price,
        "transaction_type": tx.transaction_type.lower(),
        "date": tx_date,
        "notes": tx.notes,
    })
    return {"id": doc_ref.id, "message": "Transazione aggiunta con successo"}


@router.delete("/{tx_id}")
def delete_transaction(tx_id: str):
    doc_ref = db.collection("transactions").document(tx_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    doc_ref.delete()
    return {"message": "Transazione eliminata"}


@router.get("/price/{asset_type}/{ticker}")
def get_price(asset_type: str, ticker: str):
    price = get_asset_price(ticker.upper(), asset_type.lower())
    if price is None:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")
    return {"ticker": ticker.upper(), "price": price}

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore as fb_firestore
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


def _init_firebase():
    if firebase_admin._apps:
        return
    creds_json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    creds_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
    if creds_json_str:
        cred = credentials.Certificate(json.loads(creds_json_str))
    elif os.path.exists(creds_path):
        cred = credentials.Certificate(creds_path)
    else:
        raise RuntimeError(
            "Firebase non configurato. Imposta FIREBASE_CREDENTIALS_JSON "
            "o FIREBASE_CREDENTIALS_PATH nel file .env"
        )
    firebase_admin.initialize_app(cred)


_init_firebase()
db = fb_firestore.client()


@dataclass
class Transaction:
    id: str
    asset_type: str
    ticker: str
    name: str
    quantity: float
    price: float
    total_value: float
    transaction_type: str
    date: datetime
    notes: Optional[str] = None


@dataclass
class Report:
    id: str
    content: str
    created_at: datetime
    report_type: str = "weekly"


def doc_to_transaction(doc) -> Transaction:
    data = doc.to_dict()
    date = data.get("date")
    if not isinstance(date, datetime):
        date = datetime.now()
    return Transaction(
        id=doc.id,
        asset_type=data.get("asset_type", ""),
        ticker=data.get("ticker", ""),
        name=data.get("name", ""),
        quantity=float(data.get("quantity", 0)),
        price=float(data.get("price", 0)),
        total_value=float(data.get("total_value", 0)),
        transaction_type=data.get("transaction_type", "buy"),
        date=date,
        notes=data.get("notes"),
    )


def get_all_transactions() -> list[Transaction]:
    docs = db.collection("transactions").order_by("date", direction="DESCENDING").get()
    return [doc_to_transaction(d) for d in docs]

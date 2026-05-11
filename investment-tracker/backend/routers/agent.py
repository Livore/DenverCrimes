from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import db
from services.agent_service import chat_with_agent, generate_portfolio_report

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatMessage(BaseModel):
    message: str
    history: Optional[list[dict]] = []


@router.post("/chat")
def chat(payload: ChatMessage):
    response = chat_with_agent(payload.message, payload.history or [])
    return {"response": response}


@router.post("/report")
def generate_report():
    content = generate_portfolio_report()
    _, doc_ref = db.collection("reports").add({
        "content": content,
        "report_type": "manual",
        "created_at": datetime.utcnow(),
    })
    return {"id": doc_ref.id, "content": content, "created_at": datetime.utcnow().isoformat()}


@router.get("/reports")
def list_reports():
    docs = db.collection("reports").order_by("created_at", direction="DESCENDING").limit(10).get()
    result = []
    for doc in docs:
        data = doc.to_dict()
        created_at = data.get("created_at")
        result.append({
            "id": doc.id,
            "content": data.get("content", ""),
            "report_type": data.get("report_type", "manual"),
            "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
        })
    return result

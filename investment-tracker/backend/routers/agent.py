from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db, Report
from services.agent_service import chat_with_agent, generate_portfolio_report
from datetime import datetime

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatMessage(BaseModel):
    message: str
    history: Optional[list[dict]] = []


@router.post("/chat")
def chat(payload: ChatMessage, db: Session = Depends(get_db)):
    response = chat_with_agent(payload.message, payload.history or [], db)
    return {"response": response}


@router.post("/report")
def generate_report(db: Session = Depends(get_db)):
    content = generate_portfolio_report(db)
    report = Report(content=content, report_type="manual", created_at=datetime.utcnow())
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": report.id, "content": content, "created_at": report.created_at.isoformat()}


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(10).all()
    return [
        {
            "id": r.id,
            "content": r.content,
            "report_type": r.report_type,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]

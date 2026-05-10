from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./investments.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String, nullable=False)  # "stock", "etf", "crypto"
    ticker = Column(String, nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # "buy", "sell"
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    report_type = Column(String, default="weekly")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

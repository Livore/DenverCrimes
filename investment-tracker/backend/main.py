from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
load_dotenv()
from database import create_tables
from routers import portfolio, transactions, agent

app = FastAPI(title="Investment Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()


app.include_router(portfolio.router)
app.include_router(transactions.router)
app.include_router(agent.router)


@app.get("/health")
def health():
    return {"status": "ok"}

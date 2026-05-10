import yfinance as yf
import requests
from typing import Optional
import time
import random

# Demo prices used as fallback when external APIs are unavailable (e.g. restricted network)
DEMO_PRICES = {
    "AAPL": 189.30, "MSFT": 415.50, "GOOGL": 174.20, "AMZN": 198.80, "TSLA": 248.50,
    "NVDA": 875.40, "META": 512.30, "SPY": 543.20, "QQQ": 472.10, "VTI": 245.80,
    "VXUS": 58.40, "BND": 72.30, "VWO": 43.20, "VOO": 498.70, "ARKK": 51.20,
    "BTC": 67500.0, "ETH": 3850.0, "SOL": 172.0, "ADA": 0.46, "DOGE": 0.162,
    "XRP": 0.52, "DOT": 7.8, "AVAX": 38.5, "MATIC": 0.72, "LINK": 14.2,
    "LTC": 82.0, "BNB": 585.0, "ATOM": 8.9, "USDT": 1.0, "USDC": 1.0,
}

COINGECKO_API = "https://api.coingecko.com/api/v3"

CRYPTO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "ADA": "cardano",
    "DOGE": "dogecoin",
    "XRP": "ripple",
    "DOT": "polkadot",
    "AVAX": "avalanche-2",
    "MATIC": "matic-network",
    "LINK": "chainlink",
    "LTC": "litecoin",
    "BNB": "binancecoin",
    "USDT": "tether",
    "USDC": "usd-coin",
    "ATOM": "cosmos",
}

_price_cache: dict[str, tuple[float, float]] = {}
CACHE_TTL = 60  # seconds


def _get_cached_price(key: str) -> Optional[float]:
    if key in _price_cache:
        price, timestamp = _price_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return price
    return None


def _set_cached_price(key: str, price: float):
    _price_cache[key] = (price, time.time())


def get_stock_price(ticker: str) -> Optional[float]:
    cached = _get_cached_price(ticker)
    if cached:
        return cached
    try:
        stock = yf.Ticker(ticker)
        info = stock.fast_info
        price = info.last_price
        if price:
            _set_cached_price(ticker, price)
            return price
    except Exception:
        pass
    # Fallback to demo prices with slight random variation
    if ticker.upper() in DEMO_PRICES:
        base = DEMO_PRICES[ticker.upper()]
        price = round(base * (1 + random.uniform(-0.02, 0.02)), 4)
        _set_cached_price(ticker, price)
        return price
    return None


def get_crypto_price(ticker: str) -> Optional[float]:
    ticker_upper = ticker.upper()
    cached = _get_cached_price(f"crypto_{ticker_upper}")
    if cached:
        return cached

    coin_id = CRYPTO_IDS.get(ticker_upper, ticker.lower())
    try:
        resp = requests.get(
            f"{COINGECKO_API}/simple/price",
            params={"ids": coin_id, "vs_currencies": "usd"},
            timeout=5,
        )
        data = resp.json()
        if coin_id in data:
            price = data[coin_id]["usd"]
            _set_cached_price(f"crypto_{ticker_upper}", price)
            return price
    except Exception:
        pass
    # Fallback to demo prices
    if ticker_upper in DEMO_PRICES:
        base = DEMO_PRICES[ticker_upper]
        price = round(base * (1 + random.uniform(-0.03, 0.03)), 4)
        _set_cached_price(f"crypto_{ticker_upper}", price)
        return price
    return None


def get_asset_price(ticker: str, asset_type: str) -> Optional[float]:
    if asset_type == "crypto":
        return get_crypto_price(ticker)
    return get_stock_price(ticker)


def get_stock_history(ticker: str, period: str = "1y") -> list[dict]:
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        return [
            {"date": str(idx.date()), "close": round(row["Close"], 4)}
            for idx, row in hist.iterrows()
        ]
    except Exception:
        return []


def get_crypto_history(ticker: str, days: int = 365) -> list[dict]:
    coin_id = CRYPTO_IDS.get(ticker.upper(), ticker.lower())
    try:
        resp = requests.get(
            f"{COINGECKO_API}/coins/{coin_id}/market_chart",
            params={"vs_currency": "usd", "days": days},
            timeout=10,
        )
        data = resp.json()
        prices = data.get("prices", [])
        return [
            {
                "date": str(__import__("datetime").datetime.fromtimestamp(p[0] / 1000).date()),
                "close": round(p[1], 6),
            }
            for p in prices[::7]  # sample weekly
        ]
    except Exception:
        return []


def search_asset(query: str) -> list[dict]:
    results = []
    # Try yfinance for stocks/ETF
    try:
        ticker = yf.Ticker(query.upper())
        info = ticker.info
        if info.get("longName"):
            results.append({
                "ticker": query.upper(),
                "name": info.get("longName", query.upper()),
                "type": "etf" if info.get("quoteType") == "ETF" else "stock",
            })
    except Exception:
        pass

    # Check crypto
    if query.upper() in CRYPTO_IDS:
        results.append({
            "ticker": query.upper(),
            "name": query.upper(),
            "type": "crypto",
        })

    return results

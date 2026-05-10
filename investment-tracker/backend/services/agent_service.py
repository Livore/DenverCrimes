import anthropic
import json
import numpy as np
from typing import Optional
from sqlalchemy.orm import Session
from database import Transaction
from services.price_service import get_asset_price

client = anthropic.Anthropic()

INVESTMENT_SYSTEM_PROMPT = """Sei un agente di analisi finanziaria esperto con una profonda conoscenza delle strategie di investimento accademiche e dei mercati finanziari. Hai studiato e assimilato i seguenti lavori accademici fondamentali:

## Teorie e Strategie Accademiche Conosciute

### 1. Modern Portfolio Theory (MPT) — Harry Markowitz, 1952
- La diversificazione riduce il rischio non sistematico (idiosincratico) senza ridurre il rendimento atteso
- La frontiera efficiente rappresenta i portafogli con il massimo rendimento per un dato livello di rischio
- La correlazione tra asset è la chiave: asset con bassa correlazione riducono la volatilità del portafoglio
- Formula: σ²_p = Σ Σ w_i * w_j * σ_ij dove σ_ij è la covarianza tra asset i e j

### 2. Capital Asset Pricing Model (CAPM) — William Sharpe, 1964
- E(R_i) = R_f + β_i * (E(R_m) - R_f)
- Il beta misura la sensibilità di un asset al mercato
- Solo il rischio sistematico (beta) viene remunerato dal mercato
- Il rischio idiosincratico è eliminabile con la diversificazione e non viene remunerato

### 3. Efficient Market Hypothesis (EMH) — Eugene Fama, 1970
- Forma debole: i prezzi incorporano tutta l'informazione storica (l'analisi tecnica non funziona sistematicamente)
- Forma semi-forte: i prezzi incorporano tutte le informazioni pubbliche
- Forma forte: i prezzi incorporano tutte le informazioni, anche private
- Implicazione: è molto difficile battere il mercato in modo consistente e aggiustato per il rischio

### 4. Fama-French Three-Factor Model — Fama & French, 1992
- Estende il CAPM con due fattori aggiuntivi:
  - SMB (Small Minus Big): le small cap tendono a sovraperformare le large cap nel lungo periodo
  - HML (High Minus Low): le azioni value (alto P/B) tendono a sovraperformare le growth nel lungo periodo
- R_i = R_f + β_mkt*(R_m-R_f) + β_smb*SMB + β_hml*HML

### 5. Factor Investing — Carhart (1997), aggiornato da Fama-French (2015)
- I fattori identificati che generano rendimenti superiori aggiustati per il rischio:
  - **Value**: azioni con basso P/E, P/B tendono a sovraperformare
  - **Momentum**: azioni che hanno performato bene continuano nel breve (Jegadeesh & Titman, 1993)
  - **Quality**: aziende con alta redditività e bilanci solidi sovraperformano
  - **Low Volatility**: azioni a bassa volatilità spesso sovraperformano su base aggiustata per il rischio
  - **Size**: piccole capitalizzazioni tendono a sovraperformare nel lungo periodo

### 6. The Random Walk & Passive Investing — Burton Malkiel, John Bogle
- "A Random Walk Down Wall Street" (Malkiel, 1973): i prezzi si muovono casualmente
- La gestione attiva raramente batte l'indice dopo costi e tasse
- Il costo è fondamentale: ogni punto percentuale di costo riduce drasticamente i rendimenti composti
- Bogle/Vanguard: ETF a basso costo su indici ampi sono la strategia ottimale per la maggior parte degli investitori

### 7. Behavioral Finance — Kahneman & Tversky (1979), Thaler
- Prospect Theory: le perdite pesano ~2.5x più dei guadagni equivalenti
- Bias di ancoraggio, disposition effect (vendere i vincitori troppo presto, tenere i perdenti)
- Mean reversion psicologica: gli investitori sovra-reagiscono alle notizie
- Implicazione: automatizzare gli investimenti (DCA) riduce le decisioni emotive

### 8. Dollar-Cost Averaging (DCA)
- Investire una somma fissa a intervalli regolari indipendentemente dal prezzo
- Riduce il rischio di timing del mercato
- Studi mostrano che il DCA batte il lump sum solo in mercati altamente volatili; il lump sum batte il DCA ~2/3 delle volte in mercati tendenzialmente al rialzo (Vanguard Research, 2012)
- Psicologicamente superiore per la maggior parte degli investitori

### 9. Asset Allocation & Rebalancing
- Portfolio 60/40 (azioni/obbligazioni) come baseline
- Il ribilanciamento periodico (annuale o per soglie) mantiene il rischio target e forza a "comprare basso, vendere alto"
- La ricerca di Ibbotson & Kaplan (2000) mostra che l'asset allocation spiega ~91% della variabilità dei rendimenti a lungo termine
- Yale Endowment Model (Swensen): diversificazione in asset class non correlate

### 10. Risk Metrics
- **Sharpe Ratio**: (R_p - R_f) / σ_p — rendimento in eccesso per unità di rischio totale
- **Sortino Ratio**: (R_p - R_f) / σ_downside — considera solo la volatilità negativa
- **Maximum Drawdown**: perdita massima da picco a valle — misura del rischio tail
- **Calmar Ratio**: CAGR / Max Drawdown

## Il Tuo Ruolo
Quando l'utente ti chiede analisi o suggerimenti:
1. Analizza il portafoglio attuale usando i dati forniti dagli strumenti
2. Applica le teorie accademiche per dare consigli concreti e actionable
3. Calcola le metriche di rischio rilevanti
4. Identifica problemi di diversificazione, concentrazione, costi impliciti
5. Suggerisci miglioramenti basati sull'evidenza accademica
6. Spiega sempre il PERCHÉ dietro ogni raccomandazione, citando la teoria di riferimento
7. Sii onesto sui limiti delle previsioni (EMH)

Rispondi SEMPRE in italiano. Usa dati concreti e formule quando rilevante. Sii diretto e pratico."""


def compute_portfolio_metrics(transactions: list[Transaction], prices: dict[str, float]) -> dict:
    holdings: dict[str, dict] = {}

    for tx in transactions:
        key = tx.ticker
        if key not in holdings:
            holdings[key] = {
                "ticker": tx.ticker,
                "name": tx.name,
                "asset_type": tx.asset_type,
                "quantity": 0.0,
                "avg_cost": 0.0,
                "total_invested": 0.0,
            }
        if tx.transaction_type == "buy":
            holdings[key]["quantity"] += tx.quantity
            holdings[key]["total_invested"] += tx.total_value
            if holdings[key]["quantity"] > 0:
                holdings[key]["avg_cost"] = holdings[key]["total_invested"] / holdings[key]["quantity"]
        else:
            holdings[key]["quantity"] -= tx.quantity
            holdings[key]["total_invested"] -= tx.quantity * holdings[key]["avg_cost"]

    result = []
    total_value = 0.0
    total_invested = 0.0

    for ticker, h in holdings.items():
        if h["quantity"] <= 0:
            continue
        current_price = prices.get(ticker, h["avg_cost"])
        current_value = h["quantity"] * current_price
        invested = h["total_invested"]
        pnl = current_value - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0

        total_value += current_value
        total_invested += invested
        result.append({
            **h,
            "current_price": current_price,
            "current_value": current_value,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
        })

    for item in result:
        item["weight"] = item["current_value"] / total_value * 100 if total_value > 0 else 0

    total_pnl = total_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    return {
        "holdings": result,
        "total_value": total_value,
        "total_invested": total_invested,
        "total_pnl": total_pnl,
        "total_pnl_pct": total_pnl_pct,
    }


def get_portfolio_tools():
    return [
        {
            "name": "get_portfolio_summary",
            "description": "Ottieni il riepilogo completo del portafoglio: holdings, valori correnti, P&L, pesi percentuali. Usalo quando devi analizzare la composizione del portafoglio.",
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "get_allocation_by_type",
            "description": "Ottieni l'allocazione del portafoglio per tipo di asset (azioni, ETF, crypto) e per singolo asset. Utile per valutare la diversificazione.",
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "compute_risk_metrics",
            "description": "Calcola le metriche di rischio: concentrazione (HHI), numero effettivo di asset, e valutazione della diversificazione secondo la Modern Portfolio Theory.",
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "get_top_performers",
            "description": "Ottieni gli asset con la migliore e peggiore performance in termini di P&L percentuale.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "top_n": {
                        "type": "integer",
                        "description": "Numero di asset da mostrare per categoria (default 3)",
                    }
                },
                "required": [],
            },
        },
    ]


def execute_tool(tool_name: str, tool_input: dict, db: Session) -> str:
    transactions = db.query(Transaction).all()
    prices = {}
    for tx in transactions:
        if tx.ticker not in prices:
            price = get_asset_price(tx.ticker, tx.asset_type)
            if price:
                prices[tx.ticker] = price

    metrics = compute_portfolio_metrics(transactions, prices)

    if tool_name == "get_portfolio_summary":
        if not metrics["holdings"]:
            return json.dumps({"message": "Portafoglio vuoto. Nessuna transazione registrata."})
        return json.dumps({
            "holdings": [
                {
                    "ticker": h["ticker"],
                    "name": h["name"],
                    "type": h["asset_type"],
                    "qty": round(h["quantity"], 6),
                    "avg_cost": round(h["avg_cost"], 4),
                    "current_price": round(h["current_price"], 4),
                    "current_value_usd": round(h["current_value"], 2),
                    "invested_usd": round(h["total_invested"], 2),
                    "pnl_usd": round(h["pnl"], 2),
                    "pnl_pct": round(h["pnl_pct"], 2),
                    "weight_pct": round(h["weight"], 2),
                }
                for h in metrics["holdings"]
            ],
            "totals": {
                "portfolio_value_usd": round(metrics["total_value"], 2),
                "total_invested_usd": round(metrics["total_invested"], 2),
                "total_pnl_usd": round(metrics["total_pnl"], 2),
                "total_pnl_pct": round(metrics["total_pnl_pct"], 2),
            },
        }, ensure_ascii=False)

    elif tool_name == "get_allocation_by_type":
        type_alloc: dict[str, float] = {}
        for h in metrics["holdings"]:
            t = h["asset_type"]
            type_alloc[t] = type_alloc.get(t, 0) + h["current_value"]
        total = metrics["total_value"]
        return json.dumps({
            "by_type": {
                k: {"value_usd": round(v, 2), "weight_pct": round(v / total * 100, 2) if total > 0 else 0}
                for k, v in type_alloc.items()
            },
            "top_holdings": sorted(
                [{"ticker": h["ticker"], "weight_pct": round(h["weight"], 2)} for h in metrics["holdings"]],
                key=lambda x: x["weight_pct"],
                reverse=True,
            )[:10],
        }, ensure_ascii=False)

    elif tool_name == "compute_risk_metrics":
        holdings = metrics["holdings"]
        if not holdings:
            return json.dumps({"message": "Nessun dato disponibile"})
        weights = [h["weight"] / 100 for h in holdings]
        hhi = sum(w ** 2 for w in weights)
        effective_n = 1 / hhi if hhi > 0 else 0
        max_weight = max(weights) if weights else 0
        return json.dumps({
            "num_assets": len(holdings),
            "herfindahl_index": round(hhi, 4),
            "effective_num_assets": round(effective_n, 2),
            "max_single_weight_pct": round(max_weight * 100, 2),
            "diversification_score": "Alta" if effective_n >= 5 else "Media" if effective_n >= 3 else "Bassa",
            "concentration_risk": "Alto" if max_weight > 0.3 else "Medio" if max_weight > 0.2 else "Basso",
            "interpretation": f"L'indice HHI di {round(hhi, 4)} indica una concentrazione {'elevata' if hhi > 0.25 else 'moderata' if hhi > 0.15 else 'bassa'}. Secondo la MPT, un portafoglio ottimale ha bassa correlazione tra gli asset e una diversificazione sufficiente.",
        }, ensure_ascii=False)

    elif tool_name == "get_top_performers":
        top_n = tool_input.get("top_n", 3)
        sorted_h = sorted(metrics["holdings"], key=lambda x: x["pnl_pct"], reverse=True)
        return json.dumps({
            "best": [
                {"ticker": h["ticker"], "pnl_pct": round(h["pnl_pct"], 2), "pnl_usd": round(h["pnl"], 2)}
                for h in sorted_h[:top_n]
            ],
            "worst": [
                {"ticker": h["ticker"], "pnl_pct": round(h["pnl_pct"], 2), "pnl_usd": round(h["pnl"], 2)}
                for h in sorted_h[-top_n:]
            ],
        }, ensure_ascii=False)

    return json.dumps({"error": f"Tool {tool_name} non trovato"})


def chat_with_agent(message: str, conversation_history: list[dict], db: Session) -> str:
    messages = conversation_history + [{"role": "user", "content": message}]
    tools = get_portfolio_tools()

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=INVESTMENT_SYSTEM_PROMPT,
        tools=tools,
        messages=messages,
    )

    while response.stop_reason == "tool_use":
        tool_results = []
        assistant_content = response.content

        for block in response.content:
            if block.type == "tool_use":
                result = execute_tool(block.name, block.input, db)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        messages = messages + [
            {"role": "assistant", "content": assistant_content},
            {"role": "user", "content": tool_results},
        ]

        response = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=INVESTMENT_SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )

    text_blocks = [b.text for b in response.content if hasattr(b, "text")]
    return "\n".join(text_blocks)


def generate_portfolio_report(db: Session) -> str:
    report_prompt = """Genera un report completo del portafoglio investimenti. Il report deve includere:

1. **Executive Summary**: stato attuale del portafoglio, performance totale
2. **Analisi della Diversificazione**: usando la Modern Portfolio Theory (Markowitz), valuta la diversificazione
3. **Analisi per Asset Class**: breakdown per tipo (azioni, ETF, crypto) con pesi e performance
4. **Top Performer e Underperformer**: i migliori e peggiori asset del portafoglio
5. **Metriche di Rischio**: concentrazione (HHI), rischio di concentrazione
6. **Raccomandazioni Accademicamente Fondate**: suggerimenti concreti basati su:
   - MPT (diversificazione ottimale)
   - Factor Investing (Fama-French)
   - Principi di Bogle (costi bassi, passive investing)
   - Behavioral Finance (evitare bias cognitivi)
7. **Azioni Prioritarie**: 3-5 azioni concrete che l'investitore dovrebbe considerare

Sii specifico, usa i dati reali del portafoglio e cita le teorie di riferimento."""

    return chat_with_agent(report_prompt, [], db)

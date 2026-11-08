# StockIQ — AI-Powered Stock Prediction Platform

Machine learning that ranks stocks, then tests trading strategies against years of real market
data, including trading fees.

Live: [stockiq-xi.vercel.app](https://stockiq-xi.vercel.app) · Code: [github.com/Axelodo7/stockiq](https://github.com/Axelodo7/stockiq)

---

## What it does

**Ranks stocks with machine learning.** A model is trained per ticker on real historical OHLCV
using 35 engineered technical features, then the universe is sorted by the model's predicted
probability of a bullish outcome. Models: XGBoost, Random Forest, LSTM, Transformer, Ensemble.

**Backtests against real market data, with fees.** The backtester consumes genuine daily bars from
Alpaca (Yahoo Finance fallback) and models realistic trading costs — per-share commission plus
slippage on both entry and exit. Returns gross vs. net, so you can see exactly what friction cost
you. The point: trading costs matter as much as picking the right stocks.

**Chart analyzer.** Upload a screenshot of any chart and get entry, stop-loss, and three
take-profit levels with R:R ratios, computed against live prices for stocks, forex, crypto, and
metals.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router  ·  React 19  ·  Tailwind v4        │
│  Clerk auth  ·  Prisma + PostgreSQL  ·  Zod validation     │
└──────────────┬──────────────────────────────┬──────────────┘
               │                              │
     ┌─────────▼─────────┐          ┌─────────▼──────────┐
     │  FastAPI (Python) │          │  Alpaca Data API   │
     │  /ml/rank          │          │  /v2/stocks/...    │
     │  /ml/backtest      │          │  /v2/stocks/bars   │
     │  /ml/train         │          └─────────┬──────────┘
     │  /ai/*             │                    │ fallback
     │  XGBoost · RF ·    │          ┌─────────▼──────────┐
     │  LSTM · Transf.    │          │  Yahoo Finance     │
     │  Ensemble          │          │  chart · quote ·    │
     └────────────────────┘          │  news · bars       │
                                      └────────────────────┘
```

### Data flow

1. **Fetch** — `/api/rank` and `/api/backtest` pull 2 years of daily OHLCV from Alpaca's
   `/v2/stocks/bars` endpoint, falling back to Yahoo Finance's chart API.
2. **Engineer** — `feature_engine.py` extracts 35 features per bar (RSI, MACD, Bollinger, ATR,
   ADX, OBV, momentum, volume profile, …).
3. **Train & predict** — `model_manager.py` fits the requested model and persists it to disk.
4. **Score** — `ranker.py` produces a probability per ticker; `backtester.py` replays the
   strategy bar-by-bar with fees applied.

---

## Testing

**276 automated tests** across three suites.

```bash
npm test              # 199 Vitest unit tests
npm run test:python   # 30 pytest tests (backtester + ranker)
npm run test:e2e      # 47 Playwright E2E tests (Chromium + WebKit)
npm run test:all      # unit + python
npm run test:coverage # coverage report
```

| Suite | Count | Covers |
|---|---|---|
| `tests/unit/indicators.test.ts` | 46 | SMA, EMA, RSI, MACD, Bollinger, VWAP, ATR, Stochastic |
| `tests/unit/schemas.test.ts` | 53 | Every Zod validation schema |
| `tests/unit/utils.test.ts` | 32 | Formatting, clamping, seeded RNG |
| `tests/unit/market-api.test.ts` | 31 | Alpaca/Yahoo parsing and fallback chains |
| `tests/unit/api-response.test.ts` | 22 | Response envelope and error mapping |
| `tests/unit/components.test.tsx` | 15 | GlassCard, MetricGlass, LiveIndicator, Progress |
| `tests/e2e/*.spec.ts` | 47 | Public pages, 404s, API contracts, mobile layout |
| `python-service/tests/` | 30 | Backtest fee accounting, ranker behaviour |

Writing these tests surfaced **five real bugs**, all fixed:

- RSI returned `100` (overbought) for a flat price series instead of `50` (neutral)
- Stochastic `%D` was misaligned with `%K` because null entries were filtered out of the window
- `tickerSchema` rejected class-share tickers like `BRK.B`
- `parseAlpacaSnapshot` returned `null` for symbols with no trade yet, ignoring the daily bar close
- The middleware matcher excluded `/api`, so `auth()` threw and **every protected endpoint
  returned 500 instead of 401**

---

## Trading cost model

Backtest defaults mirror a retail US equity broker:

| Parameter | Default | Meaning |
|---|---|---|
| `commission` | `0.005` | $0.005 per share, charged on entry *and* exit |
| `slippage_bps` | `5` | 5 basis points (0.05%) per side |

Fills are modelled as worse than the observed close (`price × (1 + slippage)` on buy,
`× (1 − slippage)` on sell), and each trade records its own `fees`. The response reports
`gross_return` (pre-fee) alongside `total_return` (net) so the cost of trading is explicit.

```python
# python-service/app/services/backtester.py
sell_price = current_price * (1 - slippage)
exit_fee   = position * commission
capital   += position * sell_price - exit_fee
```

---

## Setup

### Prerequisites

- Node.js 20+
- Python 3.11+ (for the ML service)
- PostgreSQL (or any Postgres-compatible host)
- An [Alpaca Data API](https://alpaca.markets/data) key (free tier is fine)

### Install

```bash
npm install
npx prisma generate

cd python-service
pip install -r requirements.txt
```

### Environment

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/stockiq"
ALPACA_API_KEY="..."
ALPACA_SECRET_KEY="..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
PYTHON_SERVICE_URL="http://localhost:8000"   # optional
```

Push the schema and start both services:

```bash
npx prisma db push
npm run dev                                   # Next.js on :3000
cd python-service && uvicorn app.main:app --port 8000
```

---

## API

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/stocks?q=` | No | Symbol search |
| `GET` | `/api/stock-quote?tickers=` | No | Batch quotes (Alpaca → Yahoo) |
| `GET` | `/api/stocks/stream?tickers=` | No | SSE live price stream |
| `GET` | `/api/history?ticker=&range=` | No | Historical OHLCV |
| `GET` | `/api/news?ticker=` | No | News with sentiment scoring |
| `GET` | `/api/market-indices` | No | Index quotes |
| `POST` | `/api/rank` | No | ML rankings for a universe |
| `POST` | `/api/backtest` | No | Backtest with fees |
| `POST` | `/api/train` | No | Train a model |
| `POST` | `/api/chart-analyze` | No | Chart screenshot → trade levels |
| `POST` | `/api/ai/analyze` | No | AI technical analysis |
| `POST` | `/api/ai/recommendations` | No | Buy/sell recommendations |
| `GET/POST` | `/api/portfolio` | Yes | Portfolio CRUD |
| `GET/POST` | `/api/portfolio/[id]/positions` | Yes | Positions |
| `GET/POST` | `/api/portfolio/[id]/transactions` | Yes | Transactions |
| `GET/POST` | `/api/watchlist` | Yes | Watchlist CRUD |
| `GET/POST` | `/api/watchlist/[id]/items` | Yes | Watchlist items |
| `GET/POST` | `/api/alerts` | Yes | Price alerts |
| `PUT/DELETE` | `/api/alerts/[id]` | Yes | Alert CRUD |
| `GET/PUT` | `/api/user/preferences` | Yes | Notification preferences |

AI endpoints are rate limited to 10 requests/minute per user and 5/minute per IP.

---

## Tech stack

**Frontend** — Next.js 15, React 19, TypeScript, Tailwind v4, shadcn/ui + Radix, Recharts,
lightweight-charts, Zustand, next-themes, Framer Motion

**Backend** — Next.js Route Handlers, Prisma 5, PostgreSQL, Clerk v7, Zod

**ML service** — FastAPI, XGBoost, scikit-learn, PyTorch (LSTM/Transformer), NumPy, pandas

**Data** — Alpaca Data API (primary), Yahoo Finance (fallback)

**Testing** — Vitest, @testing-library/react, Playwright, pytest

---

## Disclaimer

Nothing here is investment advice. Backtested and ranked results do not guarantee future
performance. Always do your own research and never risk more than you can afford to lose.

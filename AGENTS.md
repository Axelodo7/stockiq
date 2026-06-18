# StockIQ — AI-Powered Stock Prediction Platform

## Project Overview
StockIQ is a professional stock prediction platform with real-time market data, technical indicators, AI forecasting, portfolio management, and price alerts.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **State**: Zustand + TanStack Query patterns
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (Email + Google OAuth)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Python Service**: FastAPI (prediction engine)
- **Containerization**: Docker + docker-compose

## Folder Structure
```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (dashboard)/     # App pages (dashboard, stock, portfolio, watchlist, alerts, settings)
│   ├── (marketing)/     # Public pages (landing, pricing)
│   └── api/             # REST API routes
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # Sidebar, TopBar, PageHeader
│   ├── charts/          # Recharts wrappers
│   ├── data-display/    # PriceDisplay, MetricCard, DataTable
│   └── feedback/        # LoadingSkeleton, EmptyState
├── lib/
│   ├── engines/         # Technical indicators (SMA, EMA, RSI, MACD, etc.)
│   ├── services/        # Market data, cache
│   ├── security/        # Rate limiting
│   └── validation/      # Zod schemas
├── store/               # Zustand stores
├── hooks/               # Custom React hooks
└── types/               # TypeScript types
prisma/                  # Database schema
python-service/          # FastAPI prediction service
```

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma db seed   # Seed database
```

## Docker Commands
```bash
docker-compose up -d              # Start all services (production)
docker-compose -f docker-compose.dev.yml up -d  # Start all services (dev)
docker-compose down               # Stop all services
```

## API Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/health | No | Health check |
| GET | /api/stocks?q= | No | Search stocks |
| GET | /api/stocks/[ticker] | No | Stock detail |
| GET | /api/history?ticker=&range= | No | Historical data |
| GET/POST | /api/watchlist | Yes | User watchlists |
| CRUD | /api/watchlist/[id] | Yes | Watchlist CRUD |
| GET/POST | /api/portfolio | Yes | User portfolios |
| CRUD | /api/portfolio/[id] | Yes | Portfolio CRUD |
| GET/POST | /api/portfolio/[id]/positions | Yes | Positions |
| GET/POST | /api/portfolio/[id]/transactions | Yes | Transactions |
| GET/POST | /api/alerts | Yes | Price alerts |
| PUT/DELETE | /api/alerts/[id] | Yes | Alert CRUD |
| GET | /api/predictions?ticker= | No | AI predictions |

## Database Schema
- **Users**: Auth, roles (USER/ADMIN), subscription tiers
- **Stocks**: Ticker, company info, sector, market cap
- **Historical Data**: OHLCV with unique (stockId, date)
- **Predictions**: Price forecasts with confidence scores
- **Portfolios**: User portfolios with positions
- **Transactions**: Buy/sell/dividend records
- **Watchlists**: Stock watchlists with items
- **Alerts**: Price/volume alerts with conditions

## Technical Indicators
All indicators in `src/lib/engines/indicators.ts`:
- SMA, EMA (Simple/Exponential Moving Average)
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- VWAP (Volume Weighted Average Price)
- ATR (Average True Range)
- Stochastic Oscillator

## Code Conventions
1. Components: PascalCase files and names
2. Utilities: camelCase functions
3. Types: PascalCase interfaces
4. Constants: UPPER_SNAKE_CASE
5. Path alias: `@/` for `./src/`
6. Server Components by default, `"use client"` when needed
7. All API routes use consistent response format via `src/lib/api-response.ts`

## Environment Variables
See `.env.example` for all required variables.

## Python Service
FastAPI service at `python-service/` runs on port 8000:
- `POST /predict/` — Stock price prediction (stub)
- `POST /indicators/` — Server-side indicator calculations
- `GET /health` — Health check

"""Risk Analyzer — portfolio-level risk metrics and analysis."""
from __future__ import annotations
import math
from datetime import datetime
from app.models.schemas import OHLCV


def _returns(closes: list[float]) -> list[float]:
    return [(closes[i] / closes[i - 1]) - 1 for i in range(1, len(closes))] if len(closes) >= 2 else []


def _std_dev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((v - mean) ** 2 for v in values) / (len(values) - 1))


def _correlation(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    if n < 3:
        return 0.0
    a, b = a[-n:], b[-n:]
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((a[i] - ma) * (b[i] - mb) for i in range(n)) / (n - 1)
    sa, sb = _std_dev(a), _std_dev(b)
    return cov / (sa * sb) if sa > 0 and sb > 0 else 0.0


def analyze_portfolio_risk(positions: dict[str, list[OHLCV]], weights: dict[str, float] | None = None) -> dict:
    if not positions:
        return {"error": "No positions provided"}

    returns_map = {}
    for ticker, data in positions.items():
        closes = [d.close for d in data]
        returns_map[ticker] = _returns(closes)

    tickers = list(returns_map.keys())
    n = len(tickers)

    if weights is None:
        weights = {t: 1.0 / n for t in tickers}

    # Individual risk
    individual_risk = {}
    for t in tickers:
        rets = returns_map[t]
        vol = _std_dev(rets) * math.sqrt(252) * 100 if rets else 0
        max_dd = 0
        if rets:
            cum = 1.0
            peak = 1.0
            for r in rets:
                cum *= (1 + r)
                peak = max(peak, cum)
                dd = (cum - peak) / peak
                max_dd = min(max_dd, dd)
        individual_risk[t] = {
            "volatility_annualized": round(vol, 2),
            "max_drawdown": round(max_dd * 100, 2),
            "total_return": round((math.prod(1 + r for r in rets) - 1) * 100, 2) if rets else 0,
        }

    # Correlation matrix
    corr_matrix = {}
    for t1 in tickers:
        corr_matrix[t1] = {}
        for t2 in tickers:
            corr_matrix[t1][t2] = round(_correlation(returns_map[t1], returns_map[t2]), 3)

    # Portfolio-level metrics
    # Weighted returns
    min_len = min(len(returns_map[t]) for t in tickers) if tickers else 0
    port_returns = []
    for i in range(min_len):
        pr = sum(weights.get(t, 0) * returns_map[t][i] for t in tickers)
        port_returns.append(pr)

    port_vol = _std_dev(port_returns) * math.sqrt(252) * 100 if port_returns else 0
    port_return = (math.prod(1 + r for r in port_returns) - 1) * 100 if port_returns else 0

    # Sharpe (assume 5% risk-free)
    excess_return = port_return - 5.0
    sharpe = excess_return / port_vol if port_vol > 0 else 0

    # Max drawdown
    max_dd = 0
    if port_returns:
        cum = 1.0
        peak = 1.0
        for r in port_returns:
            cum *= (1 + r)
            peak = max(peak, cum)
            dd = (cum - peak) / peak
            max_dd = min(max_dd, dd)

    # VaR (95%)
    if port_returns:
        sorted_rets = sorted(port_returns)
        var_index = int(0.05 * len(sorted_rets))
        var_95 = sorted_rets[var_index] * 100
    else:
        var_95 = 0

    # Concentration (Herfindahl)
    hhi = sum(weights.get(t, 0) ** 2 for t in tickers)
    diversification_ratio = 1.0 / hhi if hhi > 0 else n

    # Beta (relative to equal-weight benchmark)
    bench_returns = []
    for i in range(min_len):
        br = sum(returns_map[t][i] for t in tickers) / n
        bench_returns.append(br)

    cov_port_bench = _correlation(port_returns, bench_returns) * _std_dev(port_returns) * _std_dev(bench_returns) if port_returns and bench_returns else 0
    beta = cov_port_bench / (_std_dev(bench_returns) ** 2) if _std_dev(bench_returns) > 0 else 1.0

    return {
        "portfolio_metrics": {
            "total_return_pct": round(port_return, 2),
            "volatility_annualized": round(port_vol, 2),
            "sharpe_ratio": round(sharpe, 3),
            "max_drawdown_pct": round(max_dd * 100, 2),
            "var_95_pct": round(var_95, 2),
            "beta": round(beta, 3),
            "diversification_score": round(diversification_ratio / n, 3) if n > 0 else 0,
        },
        "individual_risk": individual_risk,
        "correlation_matrix": corr_matrix,
        "concentration": {
            "herfindahl_index": round(hhi, 4),
            "effective_n": round(1 / hhi, 2) if hhi > 0 else n,
            "weights": weights,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }

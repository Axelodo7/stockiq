"""Backtesting engine: simulates trading strategy using trained ML models."""
import numpy as np
from typing import Optional
from .feature_engine import feature_engine


class BacktestEngine:
    """Walk-forward backtesting for ML trading strategies."""

    def run(
        self,
        data: list[dict],
        model,
        initial_capital: float = 10000.0,
        position_size: float = 0.1,
        stop_loss: float = 0.05,
        take_profit: float = 0.10,
        min_confidence: float = 0.55,
        commission: float = 0.005,
        slippage_bps: float = 5.0,
    ) -> dict:
        """Run backtest on historical data using a trained model.

        Args:
            commission: Per-share commission in dollars (e.g. 0.005 = $0.005/share).
            slippage_bps: Slippage in basis points applied per side (5 bps = 0.05%).
        """
        if len(data) < 70:
            return {"error": "Need at least 70 data points for backtesting"}

        closes = np.array([d["close"] for d in data], dtype=np.float64)
        dates = [d["date"] for d in data]

        # Slippage factor: fills are worse than the observed close by this ratio.
        slippage = slippage_bps / 10_000.0

        # Walk-forward: train on first 60 points, predict from 61 onwards
        capital = initial_capital
        position = 0.0  # shares held
        entry_price = 0.0
        entry_fee = 0.0  # commission paid on the opening fill
        equity_curve = []
        trades = []
        total_fees = 0.0

        for i in range(60, len(data)):
            window = data[i - 59 : i + 1]
            features = feature_engine.extract_features(window)

            if features is None:
                equity_curve.append({
                    "date": dates[i],
                    "equity": round(capital + position * closes[i], 2),
                    "position": round(position, 4),
                })
                continue

            feature_vector = np.array([[features[f] for f in feature_engine.FEATURE_NAMES]])
            prob = float(model.predict(feature_vector)[0])
            confidence = abs(prob - 0.5) * 2

            current_price = closes[i]
            current_equity = capital + position * current_price

            # Trading logic
            if position > 0:
                # Check stop loss / take profit
                pnl_pct = (current_price - entry_price) / entry_price
                if pnl_pct <= -stop_loss or pnl_pct >= take_profit:
                    # Close position — apply slippage + commission on the exit
                    sell_price = current_price * (1 - slippage)
                    exit_fee = position * commission
                    proceeds = position * sell_price - exit_fee
                    capital += proceeds
                    total_fees += exit_fee
                    trades.append({
                        "entry_date": trades[-1]["exit_date"] if trades and "exit_date" in trades[-1] else dates[max(0, i - 5)],
                        "exit_date": dates[i],
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(sell_price, 2),
                        "shares": round(position, 4),
                        "pnl": round((sell_price - entry_price) * position - exit_fee - entry_fee, 2),
                        "pnl_pct": round(pnl_pct * 100, 2),
                        "fees": round(exit_fee + entry_fee, 4),
                        "reason": "stop_loss" if pnl_pct <= -stop_loss else "take_profit",
                    })
                    position = 0.0
                    entry_price = 0.0
                    entry_fee = 0.0

                # Sell signal
                elif prob < (1 - min_confidence):
                    sell_price = current_price * (1 - slippage)
                    exit_fee = position * commission
                    proceeds = position * sell_price - exit_fee
                    capital += proceeds
                    total_fees += exit_fee
                    pnl_pct = (sell_price - entry_price) / entry_price
                    trades.append({
                        "entry_date": dates[max(0, i - 5)],
                        "exit_date": dates[i],
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(sell_price, 2),
                        "shares": round(position, 4),
                        "pnl": round((sell_price - entry_price) * position - exit_fee - entry_fee, 2),
                        "pnl_pct": round(pnl_pct * 100, 2),
                        "fees": round(exit_fee + entry_fee, 4),
                        "reason": "sell_signal",
                    })
                    position = 0.0
                    entry_price = 0.0
                    entry_fee = 0.0

            else:
                # Buy signal
                if prob > min_confidence and confidence > 0.15:
                    invest_amount = capital * position_size
                    # Fill worse than observed close due to slippage
                    fill_price = current_price * (1 + slippage)
                    if invest_amount > fill_price:
                        shares = invest_amount / fill_price
                        buy_fee = shares * commission
                        if buy_fee < invest_amount:
                            capital -= shares * fill_price + buy_fee
                            total_fees += buy_fee
                            position = shares
                            entry_price = fill_price
                            entry_fee = buy_fee

            equity_curve.append({
                "date": dates[i],
                "equity": round(capital + position * current_price, 2),
                "position": round(position, 4),
            })

        # Close any remaining position
        if position > 0:
            final_price = closes[-1] * (1 - slippage)
            exit_fee = position * commission
            capital += position * final_price - exit_fee
            total_fees += exit_fee
            pnl_pct = (final_price - entry_price) / entry_price
            trades.append({
                "entry_date": dates[max(0, len(data) - 5)],
                "exit_date": dates[-1],
                "entry_price": round(entry_price, 2),
                "exit_price": round(final_price, 2),
                "shares": round(position, 4),
                "pnl": round((final_price - entry_price) * position - exit_fee - entry_fee, 2),
                "pnl_pct": round(pnl_pct * 100, 2),
                "fees": round(exit_fee + entry_fee, 4),
                "reason": "end_of_data",
            })
            position = 0.0

        # Calculate metrics
        final_equity = capital
        total_return = (final_equity - initial_capital) / initial_capital

        # Annualized return
        n_days = len(data)
        annualized_return = None
        if n_days > 0:
            annualized_return = ((1 + total_return) ** (252 / n_days) - 1) if total_return > -1 else None

        # Sharpe ratio
        if len(equity_curve) > 1:
            equities = [e["equity"] for e in equity_curve]
            returns = np.diff(equities) / equities[:-1]
            returns = returns[np.isfinite(returns)]
            sharpe = float(np.mean(returns) / np.std(returns) * np.sqrt(252)) if len(returns) > 0 and np.std(returns) > 0 else None
        else:
            sharpe = None

        # Max drawdown
        if equity_curve:
            equities = [e["equity"] for e in equity_curve]
            peak = equities[0]
            max_dd = 0.0
            for eq in equities:
                if eq > peak:
                    peak = eq
                dd = (peak - eq) / peak
                if dd > max_dd:
                    max_dd = dd
        else:
            max_dd = 0.0

        # Win rate
        winning_trades = [t for t in trades if t["pnl"] > 0]
        win_rate = len(winning_trades) / len(trades) if trades else 0.0

        # Profit factor
        gross_profit = sum(t["pnl"] for t in trades if t["pnl"] > 0)
        gross_loss = abs(sum(t["pnl"] for t in trades if t["pnl"] < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else None

        return {
            "ticker": data[-1].get("ticker", "UNKNOWN") if data else "UNKNOWN",
            "total_return": round(total_return * 100, 2),
            "annualized_return": round(annualized_return * 100, 2) if annualized_return is not None else None,
            "sharpe_ratio": round(sharpe, 4) if sharpe is not None else None,
            "max_drawdown": round(max_dd * 100, 2),
            "win_rate": round(win_rate * 100, 2),
            "profit_factor": round(profit_factor, 4) if profit_factor is not None else None,
            "total_trades": len(trades),
            "equity_curve": equity_curve,
            "trades": trades,
            "initial_capital": initial_capital,
            "final_capital": round(final_equity, 2),
            "total_fees": round(total_fees, 2),
            "commission_per_share": commission,
            "slippage_bps": slippage_bps,
            "gross_return": round(
                ((final_equity + total_fees) - initial_capital) / initial_capital * 100, 2
            ),
        }


backtest_engine = BacktestEngine()

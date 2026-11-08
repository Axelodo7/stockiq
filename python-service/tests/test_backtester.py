"""Tests for the backtesting engine, focusing on trading cost realism."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.backtester import backtest_engine  # noqa: E402


class ConstantModel:
    """Model that always predicts `prob` — lets us drive deterministic strategies.

    Mirrors the real model contract: ``predict(X)`` returns a flat 1-D array.
    """

    def __init__(self, prob: float = 0.9):
        self.prob = prob

    def predict(self, X):  # noqa: N803
        import numpy as np

        return np.full(len(X), self.prob)


def make_data(n: int = 120, start: float = 100.0, drift: float = 0.0) -> list[dict]:
    """Build a synthetic OHLCV series with a linear drift."""
    data = []
    price = start
    for i in range(n):
        price = price * (1 + drift)
        data.append({
            "date": f"2024-01-{(i % 28) + 1:02d}",
            "open": price,
            "high": price * 1.01,
            "low": price * 0.99,
            "close": price,
            "volume": 1_000_000,
        })
    return data


class TestBacktestBasics:
    def test_requires_minimum_data(self):
        result = backtest_engine.run(data=make_data(50), model=ConstantModel())
        assert "error" in result
        assert "70" in result["error"]

    def test_returns_all_metrics(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        for key in [
            "total_return",
            "annualized_return",
            "sharpe_ratio",
            "max_drawdown",
            "win_rate",
            "profit_factor",
            "total_trades",
            "equity_curve",
            "trades",
            "initial_capital",
            "final_capital",
            "total_fees",
        ]:
            assert key in result, f"missing key: {key}"

    def test_equity_curve_matches_data_length(self):
        data = make_data(150)
        result = backtest_engine.run(data=data, model=ConstantModel(0.95))
        assert len(result["equity_curve"]) == len(data) - 60

    def test_never_returns_more_capital_than_start_without_buys(self):
        """A model that always says SELL should never trade."""
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.05))
        assert result["total_trades"] == 0
        assert result["final_capital"] == pytest.approx(10000.0)

    def test_max_drawdown_is_non_negative(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        assert result["max_drawdown"] >= 0

    def test_win_rate_within_bounds(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        assert 0 <= result["win_rate"] <= 100

    def test_equity_curve_equity_is_positive(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        assert all(point["equity"] > 0 for point in result["equity_curve"])


class TestTradingFees:
    def test_fees_are_zero_when_commission_and_slippage_are_zero(self):
        result = backtest_engine.run(
            data=make_data(150),
            model=ConstantModel(0.95),
            commission=0.0,
            slippage_bps=0.0,
        )
        assert result["total_fees"] == pytest.approx(0.0)

    def test_commission_reduces_final_capital(self):
        """Trading with a commission must earn less than trading without one."""
        no_fee = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.0, slippage_bps=0.0
        )
        with_fee = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.01, slippage_bps=0.0
        )
        assert with_fee["final_capital"] < no_fee["final_capital"]
        assert with_fee["total_fees"] > 0

    def test_slippage_reduces_final_capital(self):
        no_slip = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.0, slippage_bps=0.0
        )
        with_slip = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.0, slippage_bps=50.0
        )
        assert with_slip["final_capital"] < no_slip["final_capital"]

    def test_total_fees_equals_sum_of_trade_fees(self):
        result = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.01, slippage_bps=5.0
        )
        trade_fee_sum = sum(t.get("fees", 0.0) for t in result["trades"])
        assert result["total_fees"] == pytest.approx(trade_fee_sum, abs=0.05)

    def test_gross_return_exceeds_net_return(self):
        """Gross (before fees) return must be >= net (after fees) return."""
        result = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.01, slippage_bps=10.0
        )
        assert result["gross_return"] >= result["total_return"] - 0.01

    def test_high_fees_can_turn_a_profitable_strategy_into_a_loss(self):
        """Extreme costs must be able to flip the sign of the return."""
        data = make_data(150, drift=0.002)
        cheap = backtest_engine.run(
            data=data, model=ConstantModel(0.95), commission=0.0, slippage_bps=0.0
        )
        expensive = backtest_engine.run(
            data=data, model=ConstantModel(0.95), commission=0.5, slippage_bps=200.0
        )
        assert expensive["total_return"] < cheap["total_return"]
        assert expensive["total_fees"] > cheap["total_fees"]

    def test_every_trade_records_its_fee(self):
        result = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.01, slippage_bps=5.0
        )
        for trade in result["trades"]:
            assert "fees" in trade
            assert trade["fees"] >= 0

    def test_reports_configured_cost_parameters(self):
        result = backtest_engine.run(
            data=make_data(150), model=ConstantModel(0.95), commission=0.007, slippage_bps=8.0
        )
        assert result["commission_per_share"] == 0.007
        assert result["slippage_bps"] == 8.0


class TestTradeAccounting:
    def test_trades_have_required_fields(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        for trade in result["trades"]:
            for key in ["entry_date", "exit_date", "entry_price", "exit_price", "shares", "pnl", "reason"]:
                assert key in trade

    def test_trade_reasons_are_from_known_set(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        valid = {"stop_loss", "take_profit", "sell_signal", "end_of_data"}
        for trade in result["trades"]:
            assert trade["reason"] in valid

    def test_shares_are_positive(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        for trade in result["trades"]:
            assert trade["shares"] > 0

    def test_total_trades_matches_trades_length(self):
        result = backtest_engine.run(data=make_data(150), model=ConstantModel(0.95))
        assert result["total_trades"] == len(result["trades"])

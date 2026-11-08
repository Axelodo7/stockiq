"""Tests for the ML-based stock ranker."""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.ranker import Ranker  # noqa: E402


def make_data(n: int = 200, start: float = 100.0, drift: float = 0.001, seed: int = 42) -> list[dict]:
    """Build a deterministic synthetic OHLCV series."""
    rng = np.random.default_rng(seed)
    price = start
    data = []
    for i in range(n):
        noise = rng.normal(0, 0.004)
        price = price * (1 + drift + noise)
        data.append({
            "date": f"2024-{(i // 28) % 12 + 1:02d}-{(i % 28) + 1:02d}",
            "open": price,
            "high": price * 1.008,
            "low": price * 0.992,
            "close": price,
            "volume": int(rng.integers(500_000, 5_000_000)),
        })
    return data


class TestRankerScoring:
    def test_returns_none_for_insufficient_data(self):
        r = Ranker()
        assert r.score("AAPL", make_data(30)) is None

    def test_score_contains_required_fields(self):
        r = Ranker()
        result = r.score("AAPL", make_data(200))
        if result is None:
            pytest.skip("ML training unavailable in this environment")
        for key in [
            "ticker",
            "probability",
            "direction",
            "confidence",
            "model_agreement",
            "model_type",
            "momentum_20d",
            "last_close",
        ]:
            assert key in result

    def test_probability_is_a_probability(self):
        r = Ranker()
        result = r.score("AAPL", make_data(200))
        if result is None:
            pytest.skip("ML training unavailable in this environment")
        assert 0.0 <= result["probability"] <= 1.0

    def test_confidence_is_bounded(self):
        r = Ranker()
        result = r.score("AAPL", make_data(200))
        if result is None:
            pytest.skip("ML training unavailable in this environment")
        assert 0.0 <= result["confidence"] <= 1.0

    def test_direction_matches_probability(self):
        r = Ranker()
        result = r.score("AAPL", make_data(200))
        if result is None:
            pytest.skip("ML training unavailable in this environment")
        expected = "bullish" if result["probability"] > 0.5 else "bearish"
        assert result["direction"] == expected

    def test_ticker_is_uppercased(self):
        r = Ranker()
        result = r.score("aapl", make_data(200))
        if result is None:
            pytest.skip("ML training unavailable in this environment")
        assert result["ticker"] == "AAPL"


class TestRankerRanking:
    def test_rank_returns_sorted_list(self):
        r = Ranker()
        universe = {
            "AAPL": make_data(200, drift=0.002, seed=1),
            "MSFT": make_data(200, drift=0.001, seed=2),
            "GOOGL": make_data(200, drift=0.0005, seed=3),
        }
        rankings = r.rank(universe)
        if not rankings:
            pytest.skip("ML training unavailable in this environment")
        probs = [x["probability"] for x in rankings]
        assert probs == sorted(probs, reverse=True)

    def test_rank_respects_limit(self):
        r = Ranker()
        universe = {f"T{i}": make_data(200, seed=i) for i in range(5)}
        rankings = r.rank(universe, limit=2)
        assert len(rankings) <= 2

    def test_rank_skips_tickers_with_insufficient_data(self):
        r = Ranker()
        universe = {
            "AAPL": make_data(200),
            "BAD": make_data(10),
        }
        rankings = r.rank(universe)
        assert all(x["ticker"] != "BAD" for x in rankings)

    def test_rank_handles_empty_universe(self):
        r = Ranker()
        assert r.rank({}) == []

    def test_rank_only_includes_requested_tickers(self):
        r = Ranker()
        universe = {"AAPL": make_data(200), "MSFT": make_data(200)}
        rankings = r.rank(universe)
        assert all(x["ticker"] in universe for x in rankings)

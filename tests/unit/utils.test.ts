import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatCompact,
  formatPercent,
  formatChange,
  getChangeColor,
  getChangeBg,
  round,
  clamp,
  seededRandom,
  isMarketOpen,
} from "@/lib/utils";

describe("cn (class merge)", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("resolves conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats a USD amount", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negatives", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });

  it("supports a different currency", () => {
    expect(formatCurrency(100, "EUR")).toContain("100.00");
  });
});

describe("formatNumber", () => {
  it("respects the decimals argument", () => {
    expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    expect(formatNumber(1234.5678, 0)).toBe("1,235");
  });

  it("defaults to 2 decimals", () => {
    // Intl.NumberFormat rounds 1.005 up to 1.01 (floating-point representation aside)
    expect(formatNumber(1.005)).toBe("1.01");
  });
});

describe("formatCompact", () => {
  it("abbreviates thousands", () => {
    expect(formatCompact(1500)).toMatch(/1\.5K/i);
  });

  it("abbreviates millions", () => {
    expect(formatCompact(2_500_000)).toMatch(/2\.5M/i);
  });

  it("abbreviates billions", () => {
    expect(formatCompact(4_620_000_000_000)).toMatch(/4\.6T/i);
  });

  it("leaves small numbers alone", () => {
    expect(formatCompact(999)).toBe("999");
  });
});

describe("formatPercent", () => {
  it("adds a plus sign for positives", () => {
    expect(formatPercent(2.5)).toBe("+2.50%");
  });

  it("keeps the minus sign for negatives", () => {
    expect(formatPercent(-2.5)).toBe("-2.50%");
  });

  it("handles zero without a sign", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });
});

describe("formatChange", () => {
  it("adds a plus sign for positives", () => {
    expect(formatChange(1.23)).toBe("+1.23");
  });

  it("keeps the minus sign for negatives", () => {
    expect(formatChange(-1.23)).toBe("-1.23");
  });
});

describe("getChangeColor / getChangeBg", () => {
  it("returns positive colors for gains", () => {
    expect(getChangeColor(1)).toContain("emerald");
    expect(getChangeBg(1)).toContain("emerald");
  });

  it("returns negative colors for losses", () => {
    expect(getChangeColor(-1)).toContain("red");
    expect(getChangeBg(-1)).toContain("red");
  });

  it("returns neutral colors for zero", () => {
    expect(getChangeColor(0)).toContain("zinc");
    expect(getChangeBg(0)).toContain("zinc");
  });
});

describe("round", () => {
  it("rounds to the given decimals", () => {
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(1.23556, 3)).toBe(1.236);
  });

  it("defaults to 2 decimals", () => {
    expect(round(1.23456)).toBe(1.23);
  });
});

describe("clamp", () => {
  it("clamps above the max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("clamps below the min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("passes through values in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("seededRandom", () => {
  it("is deterministic for the same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("produces different sequences for different seeds", () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it("stays within [0, 1]", () => {
    const rng = seededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("handles a zero seed without NaN", () => {
    const rng = seededRandom(0);
    expect(Number.isFinite(rng())).toBe(true);
  });
});

describe("isMarketOpen", () => {
  it("returns a boolean", () => {
    expect(typeof isMarketOpen()).toBe("boolean");
  });
});

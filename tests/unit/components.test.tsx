import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricGlass } from "@/components/ui/metric-glass";
import { Badge } from "@/components/ui/badge";
import { LiveIndicator } from "@/components/feedback/live-indicator";
import { Progress } from "@/components/ui/progress";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello card</GlassCard>);
    expect(screen.getByText("Hello card")).toBeInTheDocument();
  });

  it("applies padding variants", () => {
    const { container } = render(<GlassCard padding="lg">X</GlassCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("p-6");
  });

  it("applies hover styles when requested", () => {
    const { container } = render(<GlassCard hover>X</GlassCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("hover");
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(<GlassCard onClick={onClick}>Click me</GlassCard>);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("MetricGlass", () => {
  it("renders the label and value", () => {
    render(<MetricGlass label="Total Value" value="$12,345" />);
    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("$12,345")).toBeInTheDocument();
  });

  it("renders a change with a sign", () => {
    render(<MetricGlass label="P&L" value="+$100" change={2.5} />);
    expect(screen.getByText(/2.50%/)).toBeInTheDocument();
  });

  it("renders numeric values with the given suffix", () => {
    render(<MetricGlass label="Rate" value={42.5} suffix="%" />);
    expect(screen.getByText("42.50%")).toBeInTheDocument();
  });

  it("renders numeric values with the given prefix", () => {
    render(<MetricGlass label="Price" value={99.99} prefix="$" />);
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("respects the decimals prop", () => {
    render(<MetricGlass label="X" value={1.23456} decimals={3} />);
    expect(screen.getByText("1.235")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});

describe("LiveIndicator", () => {
  it("shows Live when connected", () => {
    render(<LiveIndicator connected />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows Connecting when disconnected", () => {
    render(<LiveIndicator connected={false} />);
    expect(screen.getByText("Connecting")).toBeInTheDocument();
  });

  it("can hide the label", () => {
    const { container } = render(<LiveIndicator connected showLabel={false} />);
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(container.querySelector("span")).toBeTruthy();
  });
});

describe("Progress", () => {
  it("renders with a value", () => {
    const { container } = render(<Progress value={45} />);
    expect(container.firstElementChild).toBeTruthy();
  });

  it("clamps values above 100", () => {
    const { container } = render(<Progress value={150} />);
    const bar = container.querySelector("[style]") as HTMLElement | null;
    if (bar) {
      const width = bar.style.width;
      expect(width === "100%" || width === "").toBe(true);
    }
  });
});

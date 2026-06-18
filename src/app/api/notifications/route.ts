import { NextResponse } from "next/server";

export interface Notification {
  id: string;
  type: "alert" | "prediction" | "portfolio" | "system" | "earnings";
  title: string;
  message: string;
  ticker?: string;
  read: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "alert", title: "Price Alert Triggered", message: "TSLA crossed above $320 target", ticker: "TSLA", read: false, createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: "2", type: "prediction", title: "Prediction Updated", message: "AAPL 7-day forecast updated to bullish", ticker: "AAPL", read: false, createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: "3", type: "portfolio", title: "Portfolio Update", message: "Daily P&L: +$2,891.20 (+2.34%)", read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "4", type: "earnings", title: "Earnings Reminder", message: "NVDA reports earnings in 8 days", ticker: "NVDA", read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "5", type: "system", title: "Model Trained", message: "XGBoost model trained for AAPL", ticker: "AAPL", read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "6", type: "alert", title: "Volume Spike Detected", message: "NVDA volume 2.3x above average", ticker: "NVDA", read: true, createdAt: new Date(Date.now() - 14400000).toISOString() },
];

export async function GET() {
  return NextResponse.json({ success: true, data: mockNotifications });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, read } = body;
    const notif = mockNotifications.find((n) => n.id === id);
    if (notif) {
      notif.read = read;
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const idx = mockNotifications.findIndex((n) => n.id === id);
      if (idx >= 0) mockNotifications.splice(idx, 1);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

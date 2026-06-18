/**
 * Email notification service using Resend.
 * Requires RESEND_API_KEY env var. Gracefully degrades if not configured.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "StockIQ <notifications@stockiq.app>";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      console.error("[Email] Failed to send:", await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Error sending:", err);
    return false;
  }
}

export function buildAlertEmail(ticker: string, condition: string, target: number, current: number): EmailPayload & { subject: string } {
  return {
    to: "",
    subject: `StockIQ Alert: ${ticker} ${condition} $${target}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #050810, #0a0e17); border-radius: 12px; padding: 32px; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 24px; background: linear-gradient(135deg, #00d4ff, #b388ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            StockIQ Alert
          </h1>
          <p style="margin: 0 0 24px; color: #8b92a5; font-size: 14px;">Price alert triggered</p>

          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #8b92a5; font-size: 13px;">Ticker</span>
              <span style="font-weight: 700; font-size: 15px; font-family: monospace;">${ticker}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #8b92a5; font-size: 13px;">Condition</span>
              <span style="font-size: 14px;">${condition}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #8b92a5; font-size: 13px;">Target</span>
              <span style="font-weight: 700; font-size: 15px; font-family: monospace;">$${target.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b92a5; font-size: 13px;">Current Price</span>
              <span style="font-weight: 700; font-size: 15px; font-family: monospace; color: #00e676;">$${current.toFixed(2)}</span>
            </div>
          </div>

          <a href="https://stockiq.app/stock/${ticker}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #7c4dff); color: black; font-weight: 700; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px;">
            View in StockIQ
          </a>

          <p style="margin: 24px 0 0; color: #4a5068; font-size: 11px;">
            This is an automated alert from StockIQ. Predictions are estimates only — not investment advice.
          </p>
        </div>
      </div>
    `,
  };
}

export function buildPredictionEmail(ticker: string, signal: string, confidence: number, targetPrice: number): EmailPayload & { subject: string } {
  return {
    to: "",
    subject: `StockIQ Prediction: ${ticker} signal updated to ${signal}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #050810, #0a0e17); border-radius: 12px; padding: 32px; color: white;">
          <h1 style="margin: 0 0 8px; font-size: 24px; background: linear-gradient(135deg, #00d4ff, #b388ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            AI Prediction Update
          </h1>
          <p style="margin: 0 0 24px; color: #8b92a5; font-size: 14px;">New prediction generated for ${ticker}</p>

          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #8b92a5; font-size: 13px;">Signal</span>
              <span style="font-weight: 700; font-size: 15px; color: ${signal === "bullish" ? "#00e676" : "#ff1744"};">${signal.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #8b92a5; font-size: 13px;">Confidence</span>
              <span style="font-weight: 700; font-size: 15px; font-family: monospace;">${(confidence * 100).toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b92a5; font-size: 13px;">7-Day Target</span>
              <span style="font-weight: 700; font-size: 15px; font-family: monospace;">$${targetPrice.toFixed(2)}</span>
            </div>
          </div>

          <a href="https://stockiq.app/stock/${ticker}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #7c4dff); color: black; font-weight: 700; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px;">
            View Full Analysis
          </a>

          <p style="margin: 24px 0 0; color: #4a5068; font-size: 11px;">
            Predictions are estimates for analytical purposes only. Not investment advice. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    `,
  };
}

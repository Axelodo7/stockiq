/**
 * Audit logging service.
 * Tracks user actions for compliance and debugging.
 * In production, replace with database persistence.
 */

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.signup"
  | "prediction.generated"
  | "prediction.viewed"
  | "model.trained"
  | "model.deleted"
  | "backtest.run"
  | "alert.created"
  | "alert.triggered"
  | "alert.deleted"
  | "watchlist.created"
  | "watchlist.updated"
  | "portfolio.created"
  | "portfolio.updated"
  | "portfolio.position.added"
  | "portfolio.position.removed"
  | "settings.updated"
  | "subscription.changed"
  | "email.sent"
  | "api.request";

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 1000;

  log(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.logs.push(fullEntry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (process.env.NODE_ENV === "development") {
      const status = fullEntry.success ? "✓" : "✗";
      console.log(
        `[Audit] ${status} ${fullEntry.action} | ${fullEntry.resource || ""} ${fullEntry.resourceId || ""} | ${fullEntry.userId || "anon"}`
      );
    }

    return fullEntry;
  }

  /** Get recent logs */
  getRecent(limit = 50): AuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  /** Get logs for a specific user */
  getUserLogs(userId: string, limit = 50): AuditLogEntry[] {
    return this.logs.filter((l) => l.userId === userId).slice(-limit);
  }

  /** Get logs for a specific action */
  getActionLogs(action: AuditAction, limit = 50): AuditLogEntry[] {
    return this.logs.filter((l) => l.action === action).slice(-limit);
  }

  /** Get log stats */
  stats() {
    const actionCounts: Record<string, number> = {};
    for (const log of this.logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }
    return {
      total: this.logs.length,
      actionCounts,
      oldestEntry: this.logs[0]?.timestamp,
      newestEntry: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  /** Clear all logs */
  clear(): void {
    this.logs = [];
  }
}

export const auditLog = new AuditLogger();

/**
 * Helper to extract client info from request headers.
 */
export function getClientInfo(headers: Headers) {
  return {
    ip: headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
    userAgent: headers.get("user-agent") || "unknown",
  };
}

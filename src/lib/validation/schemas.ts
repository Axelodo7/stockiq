import { z } from "zod";

export const tickerSchema = z
  .string()
  .min(1)
  .max(10)
  // Plain tickers (AAPL), class shares (BRK.B, RDS-A), and numbered series
  // where digits only appear in a suffix after a separator (RDS.A, BF-B)
  .regex(/^[A-Z][A-Z]*([.-][A-Z0-9]+)*$/, "Ticker must be uppercase letters, digits, dots, or hyphens");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const createPositionSchema = z.object({
  stockTicker: tickerSchema,
  shares: z.number().positive(),
  avgCost: z.number().positive(),
});

export const updatePositionSchema = z.object({
  shares: z.number().positive().optional(),
  avgCost: z.number().positive().optional(),
});

export const createTransactionSchema = z.object({
  stockTicker: tickerSchema,
  type: z.enum(["BUY", "SELL", "DIVIDEND"]),
  shares: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().min(0).default(0),
});

export const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addWatchlistItemSchema = z.object({
  stockTicker: tickerSchema,
});

export const createAlertSchema = z.object({
  stockTicker: tickerSchema,
  type: z.enum(["PRICE", "VOLUME", "PERCENT_CHANGE"]),
  condition: z.enum(["ABOVE", "BELOW", "PCT_UP", "PCT_DOWN"]),
  targetValue: z.number(),
});

export const updateAlertSchema = z.object({
  targetValue: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const predictionGenerateSchema = z.object({
  ticker: tickerSchema,
});

export const trainModelSchema = z.object({
  ticker: tickerSchema,
  model_type: z.enum(["LSTM", "TRANSFORMER", "XGBOOST", "RANDOM_FOREST", "ENSEMBLE"]).default("XGBOOST"),
});

export const backtestSchema = z.object({
  ticker: tickerSchema,
  model_type: z.enum(["LSTM", "TRANSFORMER", "XGBOOST", "RANDOM_FOREST", "ENSEMBLE"]).default("ENSEMBLE"),
  initial_capital: z.number().positive().default(10000),
});

export const historicalDataQuerySchema = z.object({
  ticker: tickerSchema,
  range: z.enum(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "MAX"]).default("1Y"),
  interval: z.enum(["1d", "1wk", "1mo"]).optional(),
});

export const signupSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type loginSchemaType = z.infer<typeof loginSchema>;
export type signupSchemaType = z.infer<typeof signupSchema>;

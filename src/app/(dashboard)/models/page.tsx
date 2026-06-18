"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/predictions/disclaimer-banner";

const MODEL_TYPES = [
  { id: "XGBOOST", label: "XGBoost", desc: "Gradient boosting, fast and accurate" },
  { id: "RANDOM_FOREST", label: "Random Forest", desc: "Robust ensemble, less overfitting" },
  { id: "LSTM", label: "LSTM Neural Net", desc: "Sequence learning, pattern detection" },
  { id: "TRANSFORMER", label: "Transformer", desc: "Self-attention, complex patterns" },
  { id: "ENSEMBLE", label: "Meta Ensemble", desc: "Combines all models, best accuracy" },
];

const TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "JPM"];

interface TrainingJob {
  id: string;
  ticker: string;
  model_type: string;
  status: "running" | "completed" | "error";
  started_at: string;
  duration_ms?: number;
  metrics?: Record<string, unknown>;
}

export default function ModelsPage() {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [selectedModel, setSelectedModel] = useState("XGBOOST");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [savedModels, setSavedModels] = useState<unknown[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<unknown[]>([]);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/train");
      const json = await res.json();
      if (json.success && json.data) {
        setSavedModels(json.data.models || []);
        setTrainingHistory(json.data.history || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleTrain = async () => {
    setIsTraining(true);
    const jobId = `${selectedTicker}_${selectedModel}_${Date.now()}`;
    const newJob: TrainingJob = {
      id: jobId,
      ticker: selectedTicker,
      model_type: selectedModel,
      status: "running",
      started_at: new Date().toISOString(),
    };
    setTrainingJobs((prev) => [newJob, ...prev]);

    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: selectedTicker, model_type: selectedModel }),
      });
      const json = await res.json();

      setTrainingJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: json.success ? "completed" : "error",
                duration_ms: json.data?.duration_ms,
                metrics: json.data?.metrics,
              }
            : j
        )
      );
      fetchModels();
    } catch {
      setTrainingJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "error" } : j))
      );
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Model Management
        </h1>
        <p className="mt-1 text-sm text-muted">
          Train, manage, and monitor your ML prediction models.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Training Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-accent" />
            Train New Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase text-muted">
                Stock Ticker
              </label>
              <div className="flex flex-wrap gap-2">
                {TICKERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTicker(t)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                      selectedTicker === t
                        ? "bg-accent text-accent-foreground"
                        : "bg-panel-elevated text-muted hover:bg-panel-elevated/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase text-muted">
                Model Type
              </label>
              <div className="space-y-1.5">
                {MODEL_TYPES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedModel === m.id
                        ? "border border-accent/30 bg-accent/10"
                        : "border border-border bg-panel hover:bg-panel-elevated"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold">{m.label}</span>
                      <span className="ml-2 text-[10px] text-muted">{m.desc}</span>
                    </div>
                    {selectedModel === m.id && (
                      <CheckCircle className="h-3.5 w-3.5 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isTraining ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Training {selectedModel} on {selectedTicker}...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Train {selectedModel} on {selectedTicker}
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* Training Jobs */}
      {trainingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-accent" />
              Training Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trainingJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    {job.status === "running" && (
                      <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                    )}
                    {job.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-positive" />
                    )}
                    {job.status === "error" && (
                      <XCircle className="h-4 w-4 text-negative" />
                    )}
                    <div>
                      <span className="font-mono text-xs font-bold">
                        {job.ticker}
                      </span>
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {job.model_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {job.duration_ms && (
                      <span className="text-[10px] text-muted">
                        {(job.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    {job.metrics && (
                      <div className="flex items-center gap-2">
                        {job.metrics.train_accuracy !== undefined && (
                          <span className="text-[10px] text-positive">
                            Acc: {Math.round((job.metrics.train_accuracy as number) * 100)}%
                          </span>
                        )}
                        {job.metrics.cv_accuracy !== undefined && (
                          <span className="text-[10px] text-muted">
                            CV: {Math.round((job.metrics.cv_accuracy as number) * 100)}%
                          </span>
                        )}
                        {job.metrics.ensemble_accuracy !== undefined && (
                          <span className="text-[10px] text-positive">
                            Acc: {Math.round((job.metrics.ensemble_accuracy as number) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    <Badge
                      variant={
                        job.status === "completed"
                          ? "default"
                          : job.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-accent" />
            Saved Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedModels.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              No trained models yet. Train a model above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Ticker
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Model
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Size
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(savedModels as Array<{ ticker: string; model_type: string; size_bytes: number; file: string }>).map(
                    (model, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs font-bold">
                          {model.ticker}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {model.model_type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted">
                          {(model.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-muted">
                          {model.file}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training History */}
      {trainingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-accent" />
              Training History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Ticker
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Model
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Accuracy
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Duration
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-muted">
                      Samples
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(trainingHistory as Array<{
                    trained_at: string;
                    ticker: string;
                    model_type: string;
                    metrics: Record<string, unknown>;
                    duration_ms: number;
                    n_samples: number;
                  }>).map((h, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-[10px] text-muted">
                        {new Date(h.trained_at).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-bold">
                        {h.ticker}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {h.model_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-[10px]">
                        {h.metrics.train_accuracy !== undefined
                          ? `${Math.round((h.metrics.train_accuracy as number) * 100)}%`
                          : h.metrics.ensemble_accuracy !== undefined
                          ? `${Math.round((h.metrics.ensemble_accuracy as number) * 100)}%`
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-muted">
                        {(h.duration_ms / 1000).toFixed(1)}s
                      </td>
                      <td className="px-3 py-2 text-[10px] text-muted">
                        {h.n_samples}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { apiClient, ApiError } from "@/lib/api-client";

export interface UserPreferences {
  id: string;
  userId: string;
  emailAlerts: boolean;
  priceAlerts: boolean;
  predictionUpdates: boolean;
  weeklyDigest: boolean;
  earningsAlerts: boolean;
  defaultPortfolio: string | null;
  defaultWatchlist: string | null;
  preferredCurrency: string;
  updatedAt: string;
}

export function usePreferences() {
  const { isLoaded, isSignedIn } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prefs = await apiClient.get<UserPreferences>("/api/user/preferences");
      setPreferences(prefs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPreferences(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      setSaving(true);
      try {
        const updated = await apiClient.put<UserPreferences>("/api/user/preferences", updates);
        setPreferences(updated);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save preferences");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { preferences, loading, error, saving, refresh: load, updatePreferences, isSignedIn };
}

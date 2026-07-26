import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserProgressData } from "../types/game";
import {
  getUserProgress,
  markLevelCompleted,
  resetAllProgress,
  saveUserProgress,
} from "../services/progressStorage";
import { syncFeedbackSettings } from "../services/feedbackSettings";
import { initSounds } from "../utils/sounds";

interface ReloadOptions {
  silent?: boolean;
}

interface ProgressContextValue {
  progress: UserProgressData | null;
  loading: boolean;
  reloadProgress: (options?: ReloadOptions) => Promise<void>;
  recordVictory: (
    levelId: number,
    moves: number,
    timeSeconds: number,
    stars: number,
  ) => Promise<UserProgressData>;
  resetProgress: () => Promise<UserProgressData>;
  toggleSound: () => Promise<void>;
  toggleHaptics: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const reloadProgress = useCallback(async (options?: ReloadOptions) => {
    const silent = options?.silent ?? hasLoadedOnce.current;

    if (!silent) {
      setLoading(true);
    }

    const data = await getUserProgress();
    syncFeedbackSettings({
      hapticsEnabled: data.hapticsEnabled,
      soundEnabled: data.soundEnabled,
    });
    void initSounds();
    setProgress(data);
    hasLoadedOnce.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    reloadProgress();
  }, [reloadProgress]);

  const recordVictory = useCallback(
    async (
      levelId: number,
      moves: number,
      timeSeconds: number,
      stars: number,
    ) => {
      const updated = await markLevelCompleted(
        levelId,
        moves,
        timeSeconds,
        stars,
      );
      setProgress(updated);
      return updated;
    },
    [],
  );

  const resetProgress = useCallback(async () => {
    const fresh = await resetAllProgress();
    setProgress(fresh);
    return fresh;
  }, []);

  const toggleSound = useCallback(async () => {
    setProgress((current) => {
      if (!current) {
        return current;
      }

      const updated = { ...current, soundEnabled: !current.soundEnabled };
      syncFeedbackSettings({
        hapticsEnabled: updated.hapticsEnabled,
        soundEnabled: updated.soundEnabled,
      });
      void saveUserProgress(updated);
      return updated;
    });
  }, []);

  const toggleHaptics = useCallback(async () => {
    setProgress((current) => {
      if (!current) {
        return current;
      }

      const updated = { ...current, hapticsEnabled: !current.hapticsEnabled };
      syncFeedbackSettings({
        hapticsEnabled: updated.hapticsEnabled,
        soundEnabled: updated.soundEnabled,
      });
      void saveUserProgress(updated);
      return updated;
    });
  }, []);

  const value: ProgressContextValue = {
    progress,
    loading,
    reloadProgress,
    recordVictory,
    resetProgress,
    toggleSound,
    toggleHaptics,
  };

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }

  return context;
}

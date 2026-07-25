import { useState, useEffect, useCallback } from 'react';
import { UserProgressData } from '../types/game';
import {
  getUserProgress,
  markLevelCompleted,
  resetAllProgress,
  saveUserProgress,
} from '../services/progressStorage';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadProgress = useCallback(async () => {
    setLoading(true);
    const data = await getUserProgress();
    setProgress(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reloadProgress();
  }, [reloadProgress]);

  const recordVictory = useCallback(
    async (levelId: number, moves: number, timeSeconds: number, stars: number) => {
      const updated = await markLevelCompleted(levelId, moves, timeSeconds, stars);
      setProgress(updated);
      return updated;
    },
    []
  );

  const resetProgress = useCallback(async () => {
    const fresh = await resetAllProgress();
    setProgress(fresh);
  }, []);

  const toggleSound = useCallback(async () => {
    if (!progress) return;
    const updated = { ...progress, soundEnabled: !progress.soundEnabled };
    setProgress(updated);
    await saveUserProgress(updated);
  }, [progress]);

  const toggleHaptics = useCallback(async () => {
    if (!progress) return;
    const updated = { ...progress, hapticsEnabled: !progress.hapticsEnabled };
    setProgress(updated);
    await saveUserProgress(updated);
  }, [progress]);

  return {
    progress,
    loading,
    reloadProgress,
    recordVictory,
    resetProgress,
    toggleSound,
    toggleHaptics,
  };
}

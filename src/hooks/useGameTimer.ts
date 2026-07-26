import { useEffect, useRef, useState } from "react";

export function useGameTimer(isInitialized: boolean, isVictory: boolean) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  elapsedTimeRef.current = elapsedTime;

  useEffect(() => {
    if (!isInitialized || isVictory) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((previousTime) => previousTime + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInitialized, isVictory]);

  return { elapsedTime, setElapsedTime, elapsedTimeRef };
}

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownOptions {
  targetTime: number;
  interval?: number;
  onComplete?: () => void;
}

interface UseCountdownReturn {
  timeLeft: number;
  isComplete: boolean;
  formatted: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useCountdown({
  targetTime,
  interval = 100,
  onComplete,
}: UseCountdownOptions): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(targetTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearCountdownInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isComplete) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [isComplete]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearCountdownInterval();
  }, [clearCountdownInterval]);

  const reset = useCallback(() => {
    clearCountdownInterval();
    setTimeLeft(targetTime);
    setIsRunning(false);
    setIsComplete(false);
  }, [targetTime, clearCountdownInterval]);

  useEffect(() => {
    if (!isRunning) return;

    const initialTime = timeLeft;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newTimeLeft = Math.max(0, initialTime - elapsed);

      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        setIsComplete(true);
        setIsRunning(false);
        clearCountdownInterval();
        onComplete?.();
      }
    }, interval);

    return clearCountdownInterval;
  }, [isRunning, timeLeft, interval, onComplete, clearCountdownInterval]);

  // Format time as MM:SS.ms or SS.ms
  const formatted = (() => {
    const totalSeconds = timeLeft / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((timeLeft % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${ms.toString().padStart(2, '0')}`;
  })();

  return {
    timeLeft,
    isComplete,
    formatted,
    start,
    pause,
    reset,
  };
}

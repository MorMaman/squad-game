import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownTimerProps {
  targetTime: Date | number;
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  showMilliseconds?: boolean;
}

export function CountdownTimer({
  targetTime,
  onComplete,
  size = 'medium',
  showMilliseconds = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const target = typeof targetTime === 'number' ? targetTime : targetTime.getTime();

    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, target - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onComplete?.();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, showMilliseconds ? 50 : 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete, showMilliseconds]);

  const formatTime = () => {
    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((timeLeft % 1000) / 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (showMilliseconds) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.time, styles[size]]}>{formatTime()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  time: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#fff',
  },
  small: {
    fontSize: 24,
  },
  medium: {
    fontSize: 48,
  },
  large: {
    fontSize: 72,
  },
});

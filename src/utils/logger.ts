/**
 * Production-safe logger utility
 * Only logs in development mode, completely silent in production
 */

const isDevelopment = process.env.NODE_ENV !== 'production' &&
                      process.env.EXPO_PUBLIC_APP_ENV !== 'production';

const isDebugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const createLogger = (level: LogLevel) => {
  return (...args: unknown[]) => {
    if (isDevelopment || isDebugMode) {
      console[level](`[${level.toUpperCase()}]`, ...args);
    }
  };
};

export const logger = {
  log: createLogger('log'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug'),
};

// For tracking events in production (implement with your analytics service)
export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.log('[ANALYTICS]', event, properties);
    }
    // TODO: Add production analytics service (e.g., Mixpanel, Amplitude)
  },

  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.log('[IDENTIFY]', userId, traits);
    }
    // TODO: Add production analytics service
  },
};

export default logger;

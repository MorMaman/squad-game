/**
 * RTL Provider Component
 * Wraps the app and provides RTL context for Hebrew language support
 * Syncs with languageStore for consistent RTL state management
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  I18nManager,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import { useLanguageStore } from '../store/languageStore';

/**
 * RTL Context value type
 */
export interface RTLContextValue {
  /** Whether the app is currently in RTL mode */
  isRTL: boolean;
  /** Current text direction */
  direction: 'ltr' | 'rtl';
  /** Whether a restart is pending to apply RTL changes */
  needsRestart: boolean;
  /** Current locale code */
  locale: string;
  /** Whether Hebrew is the current language */
  isHebrew: boolean;
  /** Trigger app restart to apply RTL changes */
  restartForRTL: () => Promise<void>;
}

/**
 * Default context value
 */
const defaultContextValue: RTLContextValue = {
  isRTL: I18nManager.isRTL,
  direction: I18nManager.isRTL ? 'rtl' : 'ltr',
  needsRestart: false,
  locale: 'en',
  isHebrew: false,
  restartForRTL: async () => {},
};

/**
 * RTL Context
 */
const RTLContext = createContext<RTLContextValue>(defaultContextValue);

/**
 * RTL Provider Props
 */
interface RTLProviderProps {
  children: ReactNode;
}

/**
 * RTL Provider Component
 * Provides RTL context and manages RTL state in sync with languageStore
 */
export function RTLProvider({ children }: RTLProviderProps) {
  const {
    language,
    isRTL: storeIsRTL,
    needsRestart,
    restartApp,
  } = useLanguageStore();

  // On native, use I18nManager.isRTL for actual layout direction
  // On web, use the store's isRTL value
  const actualIsRTL = Platform.OS === 'web' ? storeIsRTL : I18nManager.isRTL;

  // Context value synced with language store
  const contextValue = useMemo<RTLContextValue>(
    () => ({
      isRTL: actualIsRTL,
      direction: actualIsRTL ? 'rtl' : 'ltr',
      needsRestart,
      locale: language,
      isHebrew: language === 'he',
      restartForRTL: restartApp,
    }),
    [actualIsRTL, needsRestart, language, restartApp]
  );

  // Apply RTL direction to the root view for web
  const rootStyle = useMemo(() => {
    if (Platform.OS === 'web') {
      return {
        flex: 1,
        direction: storeIsRTL ? 'rtl' : 'ltr',
      } as const;
    }
    return styles.root;
  }, [storeIsRTL]);

  return (
    <RTLContext.Provider value={contextValue}>
      <View style={rootStyle}>
        {children}
      </View>
    </RTLContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

/**
 * Hook to access RTL context
 */
export function useRTLContext(): RTLContextValue {
  const context = useContext(RTLContext);

  if (!context) {
    throw new Error('useRTLContext must be used within an RTLProvider');
  }

  return context;
}

/**
 * Hook to check if RTL mode is enabled
 */
export function useIsRTL(): boolean {
  const { isRTL } = useRTLContext();
  return isRTL;
}

/**
 * Hook to get current text direction
 */
export function useDirection(): 'ltr' | 'rtl' {
  const { direction } = useRTLContext();
  return direction;
}

/**
 * HOC to provide RTL awareness to a component
 */
export function withRTL<P extends object>(
  WrappedComponent: React.ComponentType<P & { isRTL: boolean; direction: 'ltr' | 'rtl' }>
): React.FC<P> {
  return function RTLAwareComponent(props: P) {
    const { isRTL, direction } = useRTLContext();

    return <WrappedComponent {...props} isRTL={isRTL} direction={direction} />;
  };
}

export default RTLProvider;

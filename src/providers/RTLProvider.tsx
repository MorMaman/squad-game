/**
 * RTL Provider Component
 * Wraps the app and provides RTL context for Hebrew language support
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
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RTL_STORAGE_KEY = '@squad_game_rtl_enabled';

/**
 * RTL Context value type
 */
export interface RTLContextValue {
  /** Whether the app is currently in RTL mode */
  isRTL: boolean;
  /** Current text direction */
  direction: 'ltr' | 'rtl';
  /** Toggle RTL mode (requires app restart) */
  toggleRTL: () => Promise<void>;
  /** Set RTL mode explicitly (requires app restart) */
  setRTL: (enabled: boolean) => Promise<void>;
  /** Whether a restart is pending to apply RTL changes */
  restartPending: boolean;
  /** Current locale code */
  locale: string;
  /** Whether Hebrew is the current language */
  isHebrew: boolean;
}

/**
 * Default context value
 */
const defaultContextValue: RTLContextValue = {
  isRTL: I18nManager.isRTL,
  direction: I18nManager.isRTL ? 'rtl' : 'ltr',
  toggleRTL: async () => {},
  setRTL: async () => {},
  restartPending: false,
  locale: 'en',
  isHebrew: false,
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
  /** Default locale to use if none is detected */
  defaultLocale?: string;
  /** Force RTL mode regardless of locale */
  forceRTL?: boolean;
}

/**
 * Hebrew locale codes
 */
const HEBREW_LOCALES = ['he', 'he-IL', 'iw', 'iw-IL'];

/**
 * Get device locale
 */
function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'web') {
      return navigator?.language || 'en';
    }

    // Try to get locale from Expo Localization or native modules
    const { ExpoLocalization } = NativeModules;
    if (ExpoLocalization?.locale) {
      return ExpoLocalization.locale;
    }

    // Fallback for older React Native versions
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    return locale || 'en';
  } catch {
    return 'en';
  }
}

/**
 * Check if locale is Hebrew
 */
function isHebrewLocale(locale: string): boolean {
  const normalizedLocale = locale.toLowerCase().split('_')[0].split('-')[0];
  return HEBREW_LOCALES.some((hl) => hl.toLowerCase().startsWith(normalizedLocale));
}

/**
 * Apply RTL settings to the app
 * Note: Changes require app restart to take full effect
 */
function applyRTLSettings(enable: boolean): void {
  if (I18nManager.isRTL !== enable) {
    I18nManager.allowRTL(enable);
    I18nManager.forceRTL(enable);
  }
}

/**
 * RTL Provider Component
 * Provides RTL context and manages RTL state
 */
export function RTLProvider({
  children,
  defaultLocale = 'en',
  forceRTL: forceRTLProp,
}: RTLProviderProps) {
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [restartPending, setRestartPending] = useState(false);
  const [locale, setLocale] = useState(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RTL settings on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Get device locale
        const deviceLocale = getDeviceLocale();
        setLocale(deviceLocale);

        // Check for stored RTL preference
        const storedRTL = await AsyncStorage.getItem(RTL_STORAGE_KEY);

        // Determine if RTL should be enabled
        let shouldEnableRTL: boolean;

        if (forceRTLProp !== undefined) {
          // Use forced RTL prop
          shouldEnableRTL = forceRTLProp;
        } else if (storedRTL !== null) {
          // Use stored preference
          shouldEnableRTL = storedRTL === 'true';
        } else {
          // Use device locale to determine RTL
          shouldEnableRTL = isHebrewLocale(deviceLocale);
        }

        // Apply RTL settings if different from current
        if (shouldEnableRTL !== I18nManager.isRTL) {
          applyRTLSettings(shouldEnableRTL);
          setRestartPending(true);
        }

        setIsRTL(shouldEnableRTL);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize RTL settings:', error);
        setIsInitialized(true);
      }
    }

    initialize();
  }, [forceRTLProp]);

  // Toggle RTL mode
  const toggleRTL = useCallback(async () => {
    const newValue = !isRTL;

    try {
      // Store preference
      await AsyncStorage.setItem(RTL_STORAGE_KEY, newValue.toString());

      // Apply settings
      applyRTLSettings(newValue);

      setIsRTL(newValue);
      setRestartPending(true);
    } catch (error) {
      console.error('Failed to toggle RTL:', error);
    }
  }, [isRTL]);

  // Set RTL mode explicitly
  const setRTLMode = useCallback(async (enabled: boolean) => {
    if (enabled === isRTL) return;

    try {
      // Store preference
      await AsyncStorage.setItem(RTL_STORAGE_KEY, enabled.toString());

      // Apply settings
      applyRTLSettings(enabled);

      setIsRTL(enabled);
      setRestartPending(true);
    } catch (error) {
      console.error('Failed to set RTL:', error);
    }
  }, [isRTL]);

  // Context value
  const contextValue = useMemo<RTLContextValue>(
    () => ({
      isRTL,
      direction: isRTL ? 'rtl' : 'ltr',
      toggleRTL,
      setRTL: setRTLMode,
      restartPending,
      locale,
      isHebrew: isHebrewLocale(locale),
    }),
    [isRTL, toggleRTL, setRTLMode, restartPending, locale]
  );

  return (
    <RTLContext.Provider value={contextValue}>
      {children}
    </RTLContext.Provider>
  );
}

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

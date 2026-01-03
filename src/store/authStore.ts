import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });

    try {
      // First, get existing session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth session error:', error.message);
        set({ error: error.message });
      } else if (session?.user) {
        set({ session, user: session.user });
        await get().fetchProfile();
      }

      // Set up auth state listener (this will catch all future auth changes)
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return { error: error as unknown as Error };
      }
      if (data.user) {
        set({ user: data.user, session: data.session });
        // Fetch profile immediately after signup
        await get().fetchProfile();
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return { error: error as unknown as Error };
      }
      if (data.user) {
        set({ user: data.user, session: data.session });
        // Fetch profile immediately after login
        await get().fetchProfile();
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithOtp: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get the redirect URL based on platform
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        set({ error: error.message });
        return { error: error as unknown as Error };
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (email: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        set({ error: error.message });
        return { error: error as unknown as Error };
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null, error: null });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const user = get().user;
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
        });

      if (!error) {
        await get().fetchProfile();
      }

      return { error: error as unknown as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        set({ profile: data as Profile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

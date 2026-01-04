import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useSquadStore } from '../src/store/squadStore';

export default function Index() {
  const { user, profile, isInitialized: isAuthInitialized } = useAuthStore();
  const { squads, fetchSquads, isInitialized: isSquadInitialized } = useSquadStore();

  useEffect(() => {
    if (user) {
      fetchSquads();
    }
  }, [user]);

  // Wait for auth to be initialized before making routing decisions
  if (!isAuthInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Not authenticated - go to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // No profile - go to onboarding
  if (!profile?.display_name) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Wait for squads to be fetched before deciding
  if (!isSquadInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // No squad - encourage joining/creating one (but can be skipped from that screen)
  if (squads.length === 0) {
    return <Redirect href="/(auth)/squad" />;
  }

  // Has profile and squad - go to main app
  return <Redirect href="/(tabs)" />;
}

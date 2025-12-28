import { useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useSquadStore } from '../src/store/squadStore';

export default function Index() {
  const { user, profile } = useAuthStore();
  const { fetchSquads } = useSquadStore();

  useEffect(() => {
    if (user) {
      fetchSquads();
    }
  }, [user]);

  // Not authenticated - go to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // No profile - go to onboarding
  if (!profile?.display_name) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Go directly to main app (dashboard) - squad is optional
  return <Redirect href="/(tabs)" />;
}

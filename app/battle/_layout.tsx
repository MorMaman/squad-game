/**
 * Battle Layout
 * Stack navigator for battle-related screens
 */

import { Stack } from 'expo-router';

export default function BattleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#0A0E27',
        },
      }}
    >
      <Stack.Screen
        name="vs-screen"
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

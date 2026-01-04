/**
 * Squad Stack Layout
 * Handles navigation for squad-related screens
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function SquadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#0A0E27',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="rulebook"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

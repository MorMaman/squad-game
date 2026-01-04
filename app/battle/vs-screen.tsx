/**
 * VS Battle Screen
 * Full-screen battle intro with dramatic animations
 * Route: /battle/vs-screen
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  VSBattleScreen,
  BattlePlayer,
} from '../../src/components/battle';

// Import avatar assets
const AVATAR_1 = require('../../assets/images/avatars/avatar-battle-1.png');
const AVATAR_2 = require('../../assets/images/avatars/avatar-battle-2.png');
const AVATAR_3 = require('../../assets/images/avatars/avatar-battle-3.png');

// Demo players for the VS screen
// In production, these would come from game state or route params
const DEMO_LEFT_PLAYER: BattlePlayer = {
  id: 'player-1',
  name: 'You',
  level: 12,
  avatarSource: AVATAR_1,
  stats: {
    health: 85,
    maxHealth: 100,
    attack: 42,
    defense: 28,
    speed: 35,
    special: 50,
  },
};

const DEMO_RIGHT_PLAYER: BattlePlayer = {
  id: 'player-2',
  name: 'Rival Max',
  level: 14,
  avatarSource: AVATAR_2,
  stats: {
    health: 92,
    maxHealth: 100,
    attack: 38,
    defense: 35,
    speed: 30,
    special: 45,
  },
};

export default function VSBattleScreenRoute() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleFight = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // In production, this would navigate to the actual game
    // For now, we'll just go back or to a game screen
    // router.push('/games/reaction-time');
    console.log('Fight started!');
  }, []);

  return (
    <VSBattleScreen
      leftPlayer={DEMO_LEFT_PLAYER}
      rightPlayer={DEMO_RIGHT_PLAYER}
      onBack={handleBack}
      onFight={handleFight}
      showStats={true}
      leftColor="#A3E635"
      rightColor="#EF4444"
    />
  );
}

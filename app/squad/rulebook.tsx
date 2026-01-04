/**
 * Squad Rulebook Screen
 * Dedicated Rules & Powers screen accessible from squad profile
 *
 * Route: /squad/rulebook
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RulebookScreen } from '../../src/components/rulebook';

// Mock data for demonstration - in production, this would come from the store
const MOCK_UNLOCKED_POWERS = ['double_chance', 'target_lock'];

export default function SquadRulebookScreen() {
  return (
    <>
      <StatusBar style="light" />
      <RulebookScreen unlockedPowers={MOCK_UNLOCKED_POWERS} />
    </>
  );
}

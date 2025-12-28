/**
 * Squad Game - Game Haptics Utility
 * Provides haptic feedback patterns for an immersive game experience
 * Inspired by successful mobile games like Candy Crush and Clash Royale
 */

import * as Haptics from 'expo-haptics';

/**
 * Delay utility for haptic sequences
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GameHaptics - Haptic feedback patterns for game interactions
 */
export const GameHaptics = {
  /**
   * Light tap - For UI interactions like button taps, selections
   */
  tap: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - For important actions like confirming choices
   */
  action: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - For major events like explosions, collisions
   */
  impact: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success notification - Task completion, correct answer
   */
  success: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Error notification - Wrong answer, failed action
   */
  error: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Warning notification - Caution, time running out
   */
  warning: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Level Up - Celebratory sequence: Heavy > Medium > Light > Success
   * Creates an exciting crescendo effect
   */
  levelUp: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(50);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Score Count - Selection feedback for counting animations
   * Call this repeatedly during number counting
   */
  scoreCount: (): void => {
    Haptics.selectionAsync();
  },

  /**
   * Countdown Tick - Light tap for timer countdown
   */
  countdownTick: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Countdown Final - More intense feedback for final seconds
   */
  countdownFinal: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Victory - First place celebration sequence
   * Heavy x3 + Success for maximum impact
   */
  victory: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(100);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Button Press - Quick feedback for button press in
   */
  buttonPress: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Button Release - Satisfying feedback on button release
   */
  buttonRelease: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Reward Collect - Medium tap for collecting rewards
   */
  rewardCollect: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Card Flip - Distinctive feedback for card reveals
   */
  cardFlip: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(200);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Streak Milestone - Celebration for streak achievements
   */
  streakMilestone: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(80);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Rank Up - Moving up in the leaderboard
   */
  rankUp: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(50);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Screen Shake Impact - For screen shake events
   */
  screenShake: async (intensity: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
    const feedbackStyle =
      intensity === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;

    await Haptics.impactAsync(feedbackStyle);
    await delay(40);
    await Haptics.impactAsync(feedbackStyle);
  },

  /**
   * Combo Hit - For combo/chain events (like Candy Crush cascades)
   */
  comboHit: (comboLevel: number): void => {
    // Higher combos get stronger feedback
    if (comboLevel >= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (comboLevel >= 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * XP Gain - Quick pulse for XP gains
   */
  xpGain: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Achievement Unlock - Special unlock celebration
   */
  achievementUnlock: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(100);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Power Up - Activation of a power-up or boost
   */
  powerUp: async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Pressure Tap - Quick feedback for rapid tapping games
   */
  pressureTap: (): void => {
    Haptics.selectionAsync();
  },
};

export default GameHaptics;

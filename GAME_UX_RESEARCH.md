# Squad Game - Game UX Research & Recommendations

## Executive Summary

This document provides actionable, research-backed recommendations to transform Squad Game from feeling like a "productivity app" into an exciting, addictive gaming experience. The recommendations are based on analysis of successful mobile games (Candy Crush, Clash Royale, Brawl Stars, Pokemon GO) and behavioral psychology research.

---

## 1. COLOR PSYCHOLOGY FOR GAMES

### Why Current "Productivity App" Colors Fail

Productivity apps typically use:
- Muted blues, grays, whites
- Low saturation colors
- Minimal contrast
- "Professional" subdued palettes

**Games use the opposite**: High saturation, bold contrasts, and colors that trigger emotional responses.

### Color Psychology Principles

| Color | Psychological Effect | Usage in Games |
|-------|---------------------|----------------|
| **Red/Orange** | Urgency, excitement, action | Limited-time offers, notifications, critical actions |
| **Gold/Yellow** | Achievement, reward, value | Coins, XP, premium content, victory |
| **Purple** | Mystery, rarity, premium | Legendary items, special events, exclusive content |
| **Cyan/Electric Blue** | Energy, speed, technology | Speed boosts, tech themes, active states |
| **Green** | Success, health, go/proceed | Completion, positive feedback, confirmations |
| **Pink/Magenta** | Fun, playful, social | Social features, celebrations, casual gameplay |

### Successful Game Color Analysis

**Candy Crush:**
- Bright candy colors: #FF6B35 (orange), #E91E63 (pink), #9C27B0 (purple)
- High saturation creates "visual sugar rush"
- Cascading color feedback rewards matches

**Clash Royale / Brawl Stars (Supercell):**
- Electric blue gradients: #00D4FF to #0066CC
- Gold/Orange for XP/rewards: #FFD700, #FF9500
- Deep purple for legendary: #7B2D8E
- Dark backgrounds make colors pop

**Pokemon GO:**
- Team colors create identity: #FF0000 (Valor), #FFFF00 (Instinct), #0000FF (Mystic)
- Green/blue map creates calm exploration base
- Bright overlays for action moments

### RECOMMENDED "GAME!" COLOR PALETTE FOR SQUAD GAME

```
// Primary Action Colors (Excitement)
GAME_ORANGE:      #FF6B00  // Primary CTA, urgent actions
GAME_CORAL:       #FF4757  // Notifications, alerts, competition
ELECTRIC_PURPLE:  #9B59FF  // Special events, premium, mystery

// Reward & Achievement Colors
GOLD_PRIMARY:     #FFD700  // XP, coins, primary rewards
GOLD_GLOW:        #FFA500  // Gold glow effect
CHAMPION_YELLOW:  #F1C40F  // Victory, first place

// Energy & Progress Colors
ELECTRIC_CYAN:    #00D4FF  // Active states, progress, energy
NEON_GREEN:       #00FF87  // Success, completion, go
POWER_BLUE:       #3742FA  // Secondary actions, info

// Background & Base Colors
DARK_NAVY:        #0A0E27  // Primary background (makes colors pop)
DEEP_PURPLE:      #1A1A2E  // Secondary background
MIDNIGHT_BLUE:    #16213E  // Card backgrounds

// Accent & Glow Colors
PINK_GLOW:        #FF2D92  // Social, celebration accents
FIRE_RED:         #FF3838  // Urgency, limited time
ICE_WHITE:        #F0F8FF  // Text, highlights

// Gradient Combinations
VICTORY_GRADIENT: linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)
POWER_GRADIENT:   linear-gradient(135deg, #00D4FF 0%, #9B59FF 100%)
FIRE_GRADIENT:    linear-gradient(135deg, #FF4757 0%, #FF6B00 100%)
LEGENDARY_GRADIENT: linear-gradient(135deg, #9B59FF 0%, #FF2D92 100%)
```

### Dark Mode is Essential

Games almost always use dark backgrounds because:
1. **Colors pop more** against dark backgrounds
2. **Reduces eye strain** for extended play
3. **Creates immersive atmosphere**
4. **Glows and particles are more visible**
5. **Feels more premium and "game-like"**

### Implementation Example (React Native)

```typescript
// theme/gameColors.ts
export const GAME_COLORS = {
  // Primary Palette
  primary: {
    orange: '#FF6B00',
    coral: '#FF4757',
    purple: '#9B59FF',
  },

  // Rewards
  reward: {
    gold: '#FFD700',
    goldGlow: '#FFA500',
    champion: '#F1C40F',
  },

  // Energy
  energy: {
    cyan: '#00D4FF',
    green: '#00FF87',
    blue: '#3742FA',
  },

  // Background
  background: {
    dark: '#0A0E27',
    medium: '#1A1A2E',
    card: '#16213E',
  },

  // Accents
  accent: {
    pink: '#FF2D92',
    fire: '#FF3838',
    ice: '#F0F8FF',
  },

  // Gradients (for LinearGradient component)
  gradients: {
    victory: ['#FFD700', '#FF6B00'],
    power: ['#00D4FF', '#9B59FF'],
    fire: ['#FF4757', '#FF6B00'],
    legendary: ['#9B59FF', '#FF2D92'],
  },
};
```

---

## 2. MICRO-ANIMATIONS THAT CREATE ADDICTION

### The Dopamine Loop

Every interaction should provide immediate visual feedback. This creates a dopamine loop:
1. **Action** (user taps)
2. **Feedback** (visual + haptic response)
3. **Reward** (progress/points/unlock)
4. **Anticipation** (what's next?)

### Button Press Animations

#### Bounce Effect (Primary CTA)
```typescript
// useButtonBounce.ts
import { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

export const useButtonBounce = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(0.92, { duration: 100 });
  };

  const onPressOut = () => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  return { animatedStyle, onPressIn, onPressOut };
};
```

#### Glow Pulse Effect
```typescript
// GlowButton.tsx
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const GlowButton = ({ children, onPress }) => {
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value * 0.8,
    shadowRadius: 20,
  }));

  return (
    <Animated.View style={glowStyle}>
      <Pressable onPress={onPress}>
        <LinearGradient colors={['#FF6B00', '#FF4757']} style={styles.button}>
          {children}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
```

#### Ripple Effect
```typescript
// RippleButton.tsx
const RippleButton = ({ onPress, children }) => {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const handlePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setRipplePosition({ x: locationX, y: locationY });

    rippleScale.value = 0;
    rippleOpacity.value = 0.4;

    rippleScale.value = withTiming(4, { duration: 400, easing: Easing.out(Easing.ease) });
    rippleOpacity.value = withTiming(0, { duration: 400 });

    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View
        style={[
          styles.ripple,
          rippleStyle,
          { left: ripplePosition.x - 25, top: ripplePosition.y - 25 }
        ]}
      />
      {children}
    </Pressable>
  );
};
```

### Number Counting Animations (Score/XP Going Up)

This is CRITICAL for dopamine hits. Never just change numbers - animate them!

```typescript
// AnimatedNumber.tsx
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  useDerivedValue,
  useAnimatedReaction
} from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  textStyle?: TextStyle;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber = ({
  value,
  duration = 800,
  textStyle,
  prefix = '',
  suffix = ''
}: AnimatedNumberProps) => {
  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue(0);
  const scale = useSharedValue(1);
  const color = useSharedValue('#FFFFFF');

  useEffect(() => {
    // Animate the number counting up
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    // Pop effect when value increases
    scale.value = withSequence(
      withSpring(1.3, { damping: 3, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Flash color (gold for positive)
    color.value = '#FFD700';
    color.value = withTiming('#FFFFFF', { duration: 500 });
  }, [value]);

  // Round the animated value for display
  useDerivedValue(() => {
    displayValue.value = Math.round(animatedValue.value);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    color: color.value,
  }));

  return (
    <Animated.Text style={[textStyle, animatedStyle]}>
      {prefix}{Math.round(animatedValue.value)}{suffix}
    </Animated.Text>
  );
};

// Usage for XP
<AnimatedNumber value={totalXP} prefix="+" suffix=" XP" />
```

### Card Flip/Reveal Animations

For revealing rewards, achievements, or event cards:

```typescript
// FlipCard.tsx
const FlipCard = ({ frontContent, backContent, isFlipped, onFlip }) => {
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFlipped) {
      // Add anticipation with slight scale
      scale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      rotateY.value = withTiming(180, {
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
      });
    } else {
      rotateY.value = withTiming(0, {
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value + 180}deg` },
      { scale: scale.value },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
  }));

  return (
    <Pressable onPress={onFlip}>
      <Animated.View style={frontStyle}>{frontContent}</Animated.View>
      <Animated.View style={backStyle}>{backContent}</Animated.View>
    </Pressable>
  );
};
```

### Success/Failure Feedback Animations

#### Success Animation
```typescript
// SuccessAnimation.tsx
const SuccessAnimation = ({ onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Burst in with bounce
    scale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Slight rotation for energy
    rotation.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Fade out after delay
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onComplete)();
      });
    }, 1500);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.successContainer, animatedStyle]}>
      <LinearGradient colors={['#00FF87', '#00D4FF']} style={styles.successCircle}>
        <Icon name="checkmark" size={48} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.successText}>NICE!</Text>
    </Animated.View>
  );
};
```

#### Failure/Error Animation (Shake)
```typescript
// ShakeAnimation.tsx
const useShake = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shake, animatedStyle };
};
```

### Idle Animations (Keep Things Alive)

Elements should never be completely static. Add subtle "breathing" animations:

```typescript
// BreathingAnimation.tsx
const BreathingAnimation = ({ children }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Continuous gentle pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
```

### Loading States That Feel Exciting

Replace boring spinners with game-like loaders:

```typescript
// GameLoader.tsx
const GameLoader = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Spinning
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulsing
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    // Glow pulse
    pulseOpacity.value = withRepeat(
      withTiming(0.8, { duration: 500 }),
      -1,
      true
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.loaderContainer}>
      <Animated.View style={[styles.glowCircle, pulseStyle]} />
      <Animated.View style={rotateStyle}>
        <LinearGradient
          colors={['#FF6B00', '#9B59FF']}
          style={styles.spinner}
        />
      </Animated.View>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};
```

---

## 3. PARTICLE EFFECTS & VISUAL FLAIR

### When to Trigger Confetti

Confetti should be RARE and MEANINGFUL. Overuse kills the magic.

| Trigger | Intensity | Duration |
|---------|-----------|----------|
| Complete first event ever | MASSIVE burst | 3 seconds |
| Win first place | Large celebration | 2.5 seconds |
| Complete daily challenge | Medium burst | 1.5 seconds |
| Level up | Medium with gold particles | 2 seconds |
| Unlock achievement | Small targeted burst | 1 second |
| Streak milestone (7, 30, 100 days) | MASSIVE | 3 seconds |

### Confetti Implementation

```typescript
// Confetti.tsx
import { Canvas, Circle, Group, useValue, runTiming, vec } from '@shopify/react-native-skia';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  gravity: number;
}

const CONFETTI_COLORS = [
  '#FF6B00', '#FFD700', '#00FF87', '#00D4FF',
  '#9B59FF', '#FF2D92', '#F1C40F', '#FF4757'
];

export const Confetti = ({ trigger, particleCount = 100 }) => {
  const particles = useSharedValue<ConfettiParticle[]>([]);

  useEffect(() => {
    if (trigger) {
      // Generate particles from top center
      const newParticles: ConfettiParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100,
          y: -20,
          vx: (Math.random() - 0.5) * 15,
          vy: Math.random() * 5 + 10,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 8 + 4,
          gravity: 0.3 + Math.random() * 0.2,
        });
      }

      particles.value = newParticles;

      // Animate particles
      // ... animation loop with gravity, drift, rotation
    }
  }, [trigger]);

  // ... render particles with Skia Canvas
};
```

### Sparkle Effects on Achievements

```typescript
// SparkleEffect.tsx
const SparkleEffect = ({ children, active }) => {
  const sparkles = useSharedValue<Sparkle[]>([]);

  useEffect(() => {
    if (active) {
      // Create sparkles around the element
      const interval = setInterval(() => {
        const newSparkle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          opacity: 1,
          color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
        };

        sparkles.value = [...sparkles.value.slice(-20), newSparkle];
      }, 100);

      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <View style={styles.container}>
      {children}
      <Canvas style={StyleSheet.absoluteFill}>
        {sparkles.value.map(sparkle => (
          <Star
            key={sparkle.id}
            cx={sparkle.x}
            cy={sparkle.y}
            r={sparkle.size}
            color={sparkle.color}
            opacity={sparkle.opacity}
          />
        ))}
      </Canvas>
    </View>
  );
};
```

### Glow/Pulse Effects on Important Elements

```typescript
// GlowingElement.tsx
const GlowingElement = ({ children, glowColor = '#FF6B00', intensity = 1 }) => {
  const glowRadius = useSharedValue(15);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    glowRadius.value = withRepeat(
      withSequence(
        withTiming(25 * intensity, { duration: 1000 }),
        withTiming(15 * intensity, { duration: 1000 })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [intensity]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowRadius.value,
    elevation: 10,
  }));

  return (
    <Animated.View style={glowStyle}>
      {children}
    </Animated.View>
  );
};
```

### Screen Shake for Impact Moments

Use sparingly for:
- Placing #1 on leaderboard
- Breaking a personal record
- Completing a difficult challenge
- Major level ups

```typescript
// useScreenShake.ts
export const useScreenShake = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const shake = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const magnitude = {
      light: 3,
      medium: 8,
      heavy: 15,
    }[intensity];

    const duration = {
      light: 30,
      medium: 40,
      heavy: 50,
    }[intensity];

    translateX.value = withSequence(
      withTiming(-magnitude, { duration }),
      withTiming(magnitude, { duration }),
      withTiming(-magnitude * 0.8, { duration }),
      withTiming(magnitude * 0.8, { duration }),
      withTiming(-magnitude * 0.5, { duration }),
      withTiming(magnitude * 0.5, { duration }),
      withTiming(0, { duration })
    );

    translateY.value = withSequence(
      withTiming(-magnitude * 0.3, { duration }),
      withTiming(magnitude * 0.3, { duration }),
      withTiming(-magnitude * 0.2, { duration }),
      withTiming(magnitude * 0.2, { duration }),
      withTiming(0, { duration })
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return { shake, shakeStyle };
};
```

---

## 4. SOUND & HAPTIC PATTERNS

### Haptic Feedback Moments

| Action | Haptic Type | iOS Feedback | Android Feedback |
|--------|-------------|--------------|------------------|
| Button press | Light tap | `UIImpactFeedbackGenerator(.light)` | `HapticFeedbackConstants.KEYBOARD_TAP` |
| Success/complete | Success pattern | `UINotificationFeedbackGenerator(.success)` | `HapticFeedbackConstants.CONFIRM` |
| Error/failure | Error pattern | `UINotificationFeedbackGenerator(.error)` | Custom vibration pattern |
| Level up | Heavy + Light sequence | Custom pattern | Custom pattern |
| Scoring points | Light tap | `UIImpactFeedbackGenerator(.light)` | Quick buzz |
| Opening reward | Medium tap | `UIImpactFeedbackGenerator(.medium)` | Medium buzz |
| Countdown (final 3 sec) | Light taps at each second | Tick pattern | Tick pattern |
| First place | Heavy + celebration pattern | Custom sequence | Custom sequence |

### Implementation

```typescript
// haptics.ts
import * as Haptics from 'expo-haptics';

export const GameHaptics = {
  // Light tap for UI interactions
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium impact for important actions
  action: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy impact for major events
  impact: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success notification
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Error notification
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Warning notification
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Level up celebration pattern
  levelUp: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(r => setTimeout(r, 50));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Score counting (call repeatedly)
  scoreCount: () => {
    Haptics.selectionAsync();
  },

  // Countdown tick
  countdownTick: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // First place victory
  victory: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
```

### Sound Design Recommendations

| Moment | Sound Character | Duration |
|--------|-----------------|----------|
| Button tap | Short click/pop | 50-100ms |
| Success | Bright chime, ascending | 300-500ms |
| Failure | Low thud, descending | 200-400ms |
| XP gain | Coin/bling sound | 100-200ms |
| Level up | Triumphant fanfare | 1-2 seconds |
| First place | Victory fanfare | 2-3 seconds |
| Countdown | Tick sounds | 100ms each |
| Countdown final 3 | Deeper ticks, building | 150ms each |
| Card flip | Whoosh + reveal | 400-600ms |
| Confetti | Light sparkle | 1-2 seconds |

---

## 5. GAME UI PATTERNS

### XP/Level Progress Display

**Best Practices:**
- Show progress as percentage AND visual bar
- Add milestone markers on the bar
- Animate progress filling when gained
- Show "+XP" floating numbers when earned
- Use color gradient that becomes "hotter" as you progress
- Add glow effect near completion

```typescript
// LevelProgressBar.tsx
const LevelProgressBar = ({ currentXP, requiredXP, level }) => {
  const progress = useSharedValue(0);
  const targetProgress = currentXP / requiredXP;

  useEffect(() => {
    progress.value = withSpring(targetProgress, {
      damping: 15,
      stiffness: 100,
    });
  }, [targetProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const glowIntensity = useAnimatedStyle(() => ({
    opacity: progress.value > 0.8 ? 0.8 : 0,
    shadowRadius: progress.value > 0.8 ? 20 : 0,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>

      <View style={styles.barContainer}>
        <Animated.View style={[styles.progressBar, progressStyle]}>
          <LinearGradient
            colors={['#00D4FF', '#9B59FF', '#FF6B00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Milestone markers */}
        <View style={[styles.milestone, { left: '25%' }]} />
        <View style={[styles.milestone, { left: '50%' }]} />
        <View style={[styles.milestone, { left: '75%' }]} />

        {/* Glow when near completion */}
        <Animated.View style={[styles.glow, glowIntensity]} />
      </View>

      <Text style={styles.xpText}>
        {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
      </Text>
    </View>
  );
};
```

### Exciting Leaderboards

**Key Elements:**
1. **Animated entry** - Names slide/fade in
2. **Your position highlighted** with glow
3. **Movement indicators** - Arrows showing up/down
4. **Rank badges** with distinct colors (Gold, Silver, Bronze)
5. **Live updates** with subtle animations
6. **Friends nearby** - Show friends close to your rank

```typescript
// LeaderboardRow.tsx
const LeaderboardRow = ({ rank, player, isCurrentUser, previousRank, onPress }) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(isCurrentUser ? 1.05 : 1);

  // Entrance animation with stagger
  useEffect(() => {
    translateY.value = withDelay(rank * 50, withSpring(0, { damping: 15 }));
    opacity.value = withDelay(rank * 50, withTiming(1, { duration: 300 }));
  }, []);

  // Rank change indicator
  const rankChange = previousRank - rank;

  const entryStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#4A5568';
    }
  };

  return (
    <Animated.View style={entryStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.row,
          isCurrentUser && styles.currentUserRow,
        ]}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
          {rank <= 3 ? (
            <Icon name={rank === 1 ? 'trophy' : 'medal'} color="#FFFFFF" />
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <Image source={{ uri: player.avatar }} style={styles.avatar} />
          <Text style={styles.playerName}>{player.name}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{player.score.toLocaleString()}</Text>

          {/* Rank change indicator */}
          {rankChange !== 0 && (
            <View style={[styles.changeIndicator, rankChange > 0 ? styles.up : styles.down]}>
              <Icon name={rankChange > 0 ? 'arrow-up' : 'arrow-down'} size={12} />
              <Text style={styles.changeText}>{Math.abs(rankChange)}</Text>
            </View>
          )}
        </View>

        {/* Current user glow effect */}
        {isCurrentUser && (
          <GlowingElement glowColor="#9B59FF" intensity={0.5} />
        )}
      </Pressable>
    </Animated.View>
  );
};
```

### Making Waiting/Timers Engaging

```typescript
// GameCountdown.tsx
const GameCountdown = ({ endTime, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));
  const pulseScale = useSharedValue(1);
  const urgencyColor = useSharedValue('#00D4FF');

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(endTime);
      setTimeLeft(remaining);

      // Increase urgency as time runs out
      if (remaining.total < 3600000) { // Less than 1 hour
        urgencyColor.value = '#FF4757';
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        );

        // Haptic tick for final seconds
        if (remaining.total < 10000) {
          GameHaptics.countdownTick();
        }
      } else if (remaining.total < 86400000) { // Less than 1 day
        urgencyColor.value = '#FF6B00';
      }

      if (remaining.total <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    borderColor: urgencyColor.value,
  }));

  return (
    <Animated.View style={[styles.timerContainer, timerStyle]}>
      <Icon name="timer" color={urgencyColor.value} size={20} />
      <Text style={styles.timerText}>
        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
      </Text>
      <Text style={styles.label}>TIME LEFT</Text>
    </Animated.View>
  );
};
```

### Celebrating Wins

```typescript
// VictoryScreen.tsx
const VictoryScreen = ({ rank, xpEarned, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const screenOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const xpValue = useSharedValue(0);

  useEffect(() => {
    // Screen fade in
    screenOpacity.value = withTiming(1, { duration: 300 });

    // Badge pop in with delay
    setTimeout(() => {
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      if (rank === 1) {
        GameHaptics.victory();
        setShowConfetti(true);
      } else {
        GameHaptics.success();
      }
    }, 500);

    // XP counting animation
    setTimeout(() => {
      xpValue.value = withTiming(xpEarned, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
    }, 1000);
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: screenOpacity }]}>
      {showConfetti && <Confetti particleCount={150} />}

      <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
        <LinearGradient
          colors={rank === 1 ? ['#FFD700', '#FF6B00'] : ['#9B59FF', '#00D4FF']}
          style={styles.badgeGradient}
        >
          <Text style={styles.rankText}>#{rank}</Text>
        </LinearGradient>
      </Animated.View>

      <Text style={styles.congratsText}>
        {rank === 1 ? 'CHAMPION!' : 'WELL PLAYED!'}
      </Text>

      <View style={styles.xpContainer}>
        <AnimatedNumber
          value={xpEarned}
          prefix="+"
          suffix=" XP"
          textStyle={styles.xpText}
        />
      </View>

      <GlowButton onPress={onClose}>
        <Text style={styles.buttonText}>CONTINUE</Text>
      </GlowButton>
    </Animated.View>
  );
};
```

---

## 6. SPECIFIC RECOMMENDATIONS FOR SQUAD GAME

### Home Screen: Making Daily Challenge URGENT and EXCITING

**Current Problem:** Daily challenges feel like another task on a to-do list.

**Solution:**

```typescript
// DailyChallengeCard.tsx
const DailyChallengeCard = ({ challenge, timeRemaining, onPress }) => {
  const borderGlow = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Pulsing border glow effect
  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );

    // Subtle breathing
    cardScale.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const isUrgent = timeRemaining < 3600000; // Less than 1 hour

  return (
    <Animated.View style={[
      styles.cardContainer,
      { transform: [{ scale: cardScale.value }] }
    ]}>
      {/* Animated border glow */}
      <Animated.View style={[
        styles.glowBorder,
        {
          shadowOpacity: borderGlow,
          shadowColor: isUrgent ? '#FF4757' : '#FF6B00',
        }
      ]} />

      <Pressable onPress={onPress} style={styles.card}>
        {/* Header with urgency indicator */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="flame" color="#FF6B00" size={24} />
            <Text style={styles.title}>DAILY CHALLENGE</Text>
          </View>

          {/* Countdown timer with urgency */}
          <GameCountdown
            endTime={challenge.endTime}
            urgent={isUrgent}
          />
        </View>

        {/* Challenge preview with excitement */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.challengePreview}
        >
          <Text style={styles.challengeType}>{challenge.type}</Text>
          <Text style={styles.challengeName}>{challenge.name}</Text>

          {/* Reward preview (creates desire) */}
          <View style={styles.rewardPreview}>
            <SparkleEffect active>
              <View style={styles.rewardBadge}>
                <Icon name="star" color="#FFD700" />
                <Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
              </View>
            </SparkleEffect>
          </View>
        </LinearGradient>

        {/* CTA Button with glow */}
        <GlowingElement glowColor="#00FF87">
          <LinearGradient
            colors={['#00FF87', '#00D4FF']}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>PLAY NOW</Text>
            <Icon name="arrow-forward" color="#0A0E27" />
          </LinearGradient>
        </GlowingElement>

        {/* Streak indicator */}
        {challenge.streakDays > 0 && (
          <View style={styles.streakBadge}>
            <Icon name="fire" color="#FF6B00" />
            <Text style={styles.streakText}>{challenge.streakDays} Day Streak</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};
```

**Visual Recommendations:**
1. **Glowing border** that pulses orange (always catches the eye)
2. **Countdown timer** prominently displayed (creates FOMO)
3. **Reward preview** with sparkle effect (creates desire)
4. **Streak counter** with fire icon (maintains commitment)
5. **"PLAY NOW" CTA** with green glow (action-oriented)

### Events: Making Participation Feel Like Playing a Real Game

**Current Problem:** Events feel like group tasks, not competitive games.

**Solution:**

```typescript
// EventCard.tsx
const EventCard = ({ event, onJoin }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardTilt = useSharedValue({ x: 0, y: 0 });

  // Event status colors
  const statusColors = {
    live: '#00FF87',
    upcoming: '#FF6B00',
    ended: '#4A5568',
  };

  return (
    <Animated.View style={styles.eventCard}>
      {/* Live indicator (animated) */}
      {event.status === 'live' && (
        <View style={styles.liveIndicator}>
          <BreathingAnimation>
            <View style={styles.liveDot} />
          </BreathingAnimation>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Event image with overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <LinearGradient
          colors={['transparent', '#0A0E27']}
          style={styles.imageOverlay}
        />

        {/* Participant count (social proof) */}
        <View style={styles.participantBadge}>
          <Icon name="people" color="#FFFFFF" />
          <AnimatedNumber value={event.participants} />
          <Text style={styles.participantLabel}>playing</Text>
        </View>
      </View>

      {/* Event details */}
      <View style={styles.details}>
        <Text style={styles.eventType}>{event.type.toUpperCase()}</Text>
        <Text style={styles.eventName}>{event.name}</Text>

        {/* Prize pool (if applicable) */}
        {event.prizePool && (
          <View style={styles.prizeContainer}>
            <SparkleEffect active>
              <Text style={styles.prizeLabel}>PRIZE POOL</Text>
              <Text style={styles.prizeValue}>{event.prizePool} XP</Text>
            </SparkleEffect>
          </View>
        )}

        {/* Top players preview */}
        <View style={styles.topPlayersPreview}>
          {event.topPlayers.slice(0, 3).map((player, i) => (
            <Image
              key={player.id}
              source={{ uri: player.avatar }}
              style={[
                styles.topPlayerAvatar,
                { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }
              ]}
            />
          ))}
          <Text style={styles.leadingText}>leading by {event.topScore}</Text>
        </View>
      </View>

      {/* Join button with competitive messaging */}
      <GlowButton onPress={onJoin}>
        <LinearGradient
          colors={['#9B59FF', '#FF6B00']}
          style={styles.joinButton}
        >
          <Text style={styles.joinText}>
            {event.status === 'live' ? 'JOIN THE BATTLE' : 'SET REMINDER'}
          </Text>
        </LinearGradient>
      </GlowButton>
    </Animated.View>
  );
};
```

**Key Elements:**
1. **"LIVE" badge** with pulsing animation
2. **Participant count** as social proof ("247 playing")
3. **Prize pool display** with sparkles
4. **Top players preview** (competitive motivation)
5. **Action verbs**: "JOIN THE BATTLE" not "Participate"

### Leaderboard: Making Climbing Ranks Feel Thrilling

```typescript
// ThrillLeaderboard.tsx
const ThrillLeaderboard = ({ players, currentUserId }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const currentUserRank = players.findIndex(p => p.id === currentUserId) + 1;

  return (
    <View style={styles.container}>
      {/* Header with your rank prominently */}
      <LinearGradient
        colors={['#9B59FF', '#0A0E27']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>LEADERBOARD</Text>

        {/* Your rank badge */}
        <GlowingElement glowColor="#FFD700">
          <View style={styles.yourRankBadge}>
            <Text style={styles.yourRankLabel}>YOUR RANK</Text>
            <Text style={styles.yourRankNumber}>#{currentUserRank}</Text>

            {/* Progress to next rank */}
            <View style={styles.nextRankProgress}>
              <Text style={styles.pointsToNext}>
                {players[currentUserRank - 2]?.score - players[currentUserRank - 1]?.score || 0} pts to #{currentUserRank - 1}
              </Text>
              <ProgressBar
                progress={0.7}
                color={['#FFD700', '#FF6B00']}
              />
            </View>
          </View>
        </GlowingElement>
      </LinearGradient>

      {/* Timeframe selector */}
      <View style={styles.timeframeSelector}>
        {['today', 'week', 'month', 'all-time'].map(tf => (
          <Pressable
            key={tf}
            onPress={() => setSelectedTimeframe(tf)}
            style={[
              styles.timeframeButton,
              selectedTimeframe === tf && styles.activeTimeframe
            ]}
          >
            <Text style={styles.timeframeText}>{tf.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {/* Top 3 podium */}
      <View style={styles.podium}>
        <PodiumPlace rank={2} player={players[1]} />
        <PodiumPlace rank={1} player={players[0]} />
        <PodiumPlace rank={3} player={players[2]} />
      </View>

      {/* Rest of leaderboard */}
      <FlatList
        data={players.slice(3)}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            rank={index + 4}
            player={item}
            isCurrentUser={item.id === currentUserId}
            previousRank={item.previousRank}
          />
        )}
        keyExtractor={item => item.id}
      />

      {/* "Jump to your position" button if scrolled away */}
      {currentUserRank > 10 && (
        <FloatingButton
          onPress={scrollToCurrentUser}
          label="See your position"
          icon="locate"
        />
      )}
    </View>
  );
};

// Podium component with animations
const PodiumPlace = ({ rank, player }) => {
  const height = rank === 1 ? 120 : rank === 2 ? 90 : 70;
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      rank === 1 ? 200 : rank === 2 ? 0 : 400,
      withSpring(1, { damping: 10, stiffness: 150 })
    );
  }, []);

  const podiumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rankColors = {
    1: ['#FFD700', '#FF6B00'],
    2: ['#C0C0C0', '#4A5568'],
    3: ['#CD7F32', '#8B4513'],
  };

  return (
    <Animated.View style={[styles.podiumPlace, podiumStyle]}>
      {rank === 1 && <SparkleEffect active />}

      <Image source={{ uri: player.avatar }} style={styles.podiumAvatar} />

      <LinearGradient
        colors={rankColors[rank]}
        style={[styles.podiumBlock, { height }]}
      >
        <Text style={styles.podiumRank}>{rank}</Text>
      </LinearGradient>

      <Text style={styles.podiumName}>{player.name}</Text>
      <Text style={styles.podiumScore}>{player.score.toLocaleString()}</Text>
    </Animated.View>
  );
};
```

### Profile: Making the Player Card Feel Like a Trophy

```typescript
// PlayerCard.tsx
const PlayerCard = ({ player, stats }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRotation = useSharedValue(0);
  const cardGlow = useSharedValue(0.3);

  // Determine card "rarity" based on level
  const getRarity = (level: number) => {
    if (level >= 50) return { name: 'LEGENDARY', colors: ['#FFD700', '#FF6B00', '#9B59FF'] };
    if (level >= 30) return { name: 'EPIC', colors: ['#9B59FF', '#FF2D92'] };
    if (level >= 15) return { name: 'RARE', colors: ['#00D4FF', '#3742FA'] };
    return { name: 'COMMON', colors: ['#4A5568', '#1A1A2E'] };
  };

  const rarity = getRarity(player.level);

  // Subtle tilt effect based on device motion (optional)
  // ... gyroscope implementation

  return (
    <FlipCard
      isFlipped={isFlipped}
      onFlip={() => setIsFlipped(!isFlipped)}
      frontContent={
        <GlowingElement glowColor={rarity.colors[0]} intensity={0.7}>
          <LinearGradient
            colors={[...rarity.colors, '#0A0E27']}
            style={styles.card}
          >
            {/* Holographic shimmer overlay */}
            <Animated.View style={styles.shimmerOverlay} />

            {/* Rarity badge */}
            <View style={styles.rarityBadge}>
              <Text style={styles.rarityText}>{rarity.name}</Text>
            </View>

            {/* Player avatar with frame */}
            <View style={styles.avatarFrame}>
              <Image source={{ uri: player.avatar }} style={styles.avatar} />
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{player.level}</Text>
              </View>
            </View>

            {/* Player name */}
            <Text style={styles.playerName}>{player.name}</Text>

            {/* Title/Achievement */}
            <Text style={styles.title}>{player.title || 'Rookie'}</Text>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <StatBadge icon="trophy" value={stats.wins} label="Wins" />
              <StatBadge icon="flame" value={stats.streak} label="Streak" />
              <StatBadge icon="star" value={stats.totalXP} label="XP" />
            </View>

            {/* "Tap to flip" indicator */}
            <Text style={styles.flipHint}>TAP FOR DETAILS</Text>
          </LinearGradient>
        </GlowingElement>
      }
      backContent={
        <View style={styles.cardBack}>
          {/* Detailed stats */}
          <Text style={styles.backTitle}>CAREER STATS</Text>

          <View style={styles.detailedStats}>
            <StatRow label="Events Completed" value={stats.eventsCompleted} />
            <StatRow label="Best Rank" value={`#${stats.bestRank}`} />
            <StatRow label="Win Rate" value={`${stats.winRate}%`} />
            <StatRow label="Total Challenges" value={stats.totalChallenges} />
            <StatRow label="Longest Streak" value={`${stats.longestStreak} days`} />
            <StatRow label="Member Since" value={stats.joinDate} />
          </View>

          {/* Achievement badges */}
          <Text style={styles.badgesTitle}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {stats.badges.map(badge => (
              <AchievementBadge
                key={badge.id}
                badge={badge}
                unlocked={badge.unlocked}
              />
            ))}
          </View>
        </View>
      }
    />
  );
};
```

**Trophy-like Elements:**
1. **Rarity system** (Common/Rare/Epic/Legendary based on level)
2. **Holographic shimmer** overlay effect
3. **Glowing border** based on rarity
4. **Flip animation** for detailed stats
5. **Achievement badges** displayed like trophies
6. **Title system** ("Champion", "Veteran", "Elite", etc.)

---

## Animation Timing Reference

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Button press (scale down) | 100ms | `Easing.ease` |
| Button release (bounce back) | 300ms | `withSpring({ damping: 10 })` |
| Card flip | 600ms | `Easing.inOut(Easing.cubic)` |
| Number count up | 800-1500ms | `Easing.out(Easing.cubic)` |
| Success pop | 300ms | `withSpring({ damping: 4 })` |
| Screen shake | 350ms | Sequential timing |
| Fade in | 300ms | `Easing.ease` |
| Slide in | 400ms | `withSpring({ damping: 15 })` |
| Glow pulse | 1000-2000ms | `Easing.inOut(Easing.ease)` |
| Confetti fall | 3000ms | Linear with gravity |
| Breathing idle | 4000ms | `Easing.inOut(Easing.ease)` |

---

## Implementation Priority

### Phase 1: Foundation (Days 1-2)
1. Implement new color palette
2. Create reusable button animations
3. Add haptic feedback system
4. Build animated number component

### Phase 2: Core Components (Days 3-4)
1. Daily challenge card with urgency
2. Leaderboard with animations
3. Progress bars with milestones
4. Success/failure feedback

### Phase 3: Polish (Days 5-6)
1. Confetti system
2. Particle effects
3. Player card redesign
4. Screen transitions

---

## Sources

- [Candy Crush Game UI Database](https://www.gameuidatabase.com/gameData.php?id=147)
- [How Candy Crush Mastered Game Development](https://www.juegostudio.com/blog/candy-crush-success-story)
- [Mobile Game Design Examples - Penji](https://penji.co/mobile-game-design/)
- [What Makes Mobile Apps Addictive - Code Guru](https://codeguru.ae/blog/what-makes-a-mobile-app-addictive-ui-ux-psychology/)
- [The Psychology of UX - Medium](https://medium.com/design-bootcamp/the-psychology-of-ux-what-games-teach-us-about-addictive-design-eb8e57eb7ce1)
- [The Dopamine Loop - Medium](https://medium.com/design-bootcamp/the-dopamine-loop-how-ux-designs-hook-our-brains-bd1a50a9f22e)
- [Addictive Mobile Games - Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/addictive-mobile-games)
- [Game Progress Bar Design - Medium](https://medium.com/@MaxKosyakoff/fill-the-progress-fc0fa99cabac)
- [Leaderboards in Mobile Gaming - Medium](https://medium.com/@alidrsn/climbing-the-ranks-a-guide-to-leaderboards-in-mobile-gaming-67f4f808e147)
- [FOMO in Games - Red Hare Studios](https://redharegames.wordpress.com/2025/05/16/simple-article-the-allure-of-fomo-in-games/)
- [Effective Use of Timers - Game Developer](https://www.gamedeveloper.com/design/time-for-a-timer---effective-use-of-timers-in-game-design)
- [2025 Guide to Haptics - Medium](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Haptics for Mobile Games - Interhaptics](https://interhaptics.medium.com/mobile-gaming-ux-how-haptic-feedback-can-change-the-game-3ef689f889bc)
- [Android Haptics Design Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Konfetti Library - GitHub](https://github.com/DanielMartinus/Konfetti)
- [Canvas Confetti - GitHub](https://github.com/catdad/canvas-confetti)
- [Neon Color Palettes - Creative Booster](https://creativebooster.net/blogs/colors/neon-color-palettes)
- [Neon Color Palettes - Shutterstock](https://www.shutterstock.com/blog/neon-color-palettes)

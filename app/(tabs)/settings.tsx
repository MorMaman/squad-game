/**
 * Settings Screen - Battle Game UI Design
 * Features color-coded sections with animated interactions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Avatar } from '../../src/components/Avatar';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { useAuthStore } from '../../src/store/authStore';
import { useSquadStore } from '../../src/store/squadStore';

// Battle Game Color Palette
const COLORS = {
  // Background
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',

  // Section Accent Colors
  CYAN: '#00D4FF',      // Profile/Account
  PURPLE: '#9B59FF',    // Squad info
  LIME: '#A3E635',      // Achievements
  ORANGE: '#FF6B00',    // Notifications
  GOLD: '#FFD700',      // Premium features
  RED: '#EF4444',       // Danger zone/logout

  // Text
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',

  // Borders & Dividers
  BORDER: '#374151',
  BORDER_DARK: '#1F2937',
};

// Animated Touchable Row Component
interface AnimatedRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  delay?: number;
}

function AnimatedRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  showChevron = true,
  isSwitch,
  switchValue,
  onSwitchChange,
  delay = 0,
}: AnimatedRowProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    bgOpacity.value = withTiming(0.1, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    bgOpacity.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(${iconColor === COLORS.CYAN ? '0, 212, 255' :
      iconColor === COLORS.PURPLE ? '155, 89, 255' :
      iconColor === COLORS.LIME ? '163, 230, 53' :
      iconColor === COLORS.ORANGE ? '255, 107, 0' :
      iconColor === COLORS.GOLD ? '255, 215, 0' :
      iconColor === COLORS.RED ? '239, 68, 68' : '255, 255, 255'}, ${bgOpacity.value})`,
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isSwitch}
    >
      <Animated.View
        entering={FadeInDown.delay(delay).duration(300)}
        style={[styles.settingRow, animatedStyle]}
      >
        <Animated.View style={[styles.rowBackground, bgStyle]} />
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
          {value && <Text style={styles.rowValue}>{value}</Text>}
        </View>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: COLORS.BORDER, true: `${iconColor}80` }}
            thumbColor={switchValue ? iconColor : '#f4f3f4'}
            ios_backgroundColor={COLORS.BORDER}
          />
        ) : showChevron ? (
          <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  delay?: number;
}

function SectionHeader({ title, icon, color, delay = 0 }: SectionHeaderProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={styles.sectionHeader}
    >
      <View style={[styles.sectionIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: `${color}30` }]} />
    </Animated.View>
  );
}

// Profile Card with Glow
function ProfileCard({ profile, user, onEditPress }: {
  profile: any;
  user: any;
  onEditPress: () => void;
}) {
  const glowProgress = useSharedValue(0);
  const avatarScale = useSharedValue(1);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const handleAvatarPressIn = () => {
    avatarScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handleAvatarPressOut = () => {
    avatarScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowProgress.value, [0, 1], [10, 25]);
    const shadowOpacity = interpolate(glowProgress.value, [0, 1], [0.3, 0.6]);

    return {
      shadowColor: COLORS.CYAN,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  // Calculate mock stats based on profile
  const level = Math.floor(Math.random() * 50) + 1;
  const xp = Math.floor(Math.random() * 1000);
  const wins = Math.floor(Math.random() * 100);

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      style={styles.profileCardContainer}
    >
      <LinearGradient
        colors={[COLORS.MIDNIGHT_BLUE, COLORS.DEEP_PURPLE]}
        style={styles.profileCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Elements */}
        <View style={styles.profileDecorTop} />
        <View style={styles.profileDecorBottom} />

        {/* Avatar with Glow */}
        <TouchableOpacity
          onPressIn={handleAvatarPressIn}
          onPressOut={handleAvatarPressOut}
          onPress={onEditPress}
          activeOpacity={1}
        >
          <Animated.View style={[styles.avatarWrapper, glowStyle, avatarAnimatedStyle]}>
            <LinearGradient
              colors={[COLORS.CYAN, COLORS.PURPLE]}
              style={styles.avatarRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarInner}>
                <Avatar
                  uri={profile?.avatar_url}
                  name={profile?.display_name}
                  size="xlarge"
                />
              </View>
            </LinearGradient>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Profile Info */}
        <Text style={styles.profileName}>{profile?.display_name || 'Player'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileBtn} onPress={onEditPress}>
          <LinearGradient
            colors={[`${COLORS.CYAN}30`, `${COLORS.PURPLE}30`]}
            style={styles.editProfileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="pencil" size={16} color={COLORS.CYAN} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

// Squad Card Component
function SquadCard({ squad, isCurrent, onSwitch, onLeave }: {
  squad: any;
  isCurrent: boolean;
  onSwitch?: () => void;
  onLeave?: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={!isCurrent ? onSwitch : undefined}
      activeOpacity={1}
    >
      <Animated.View style={[styles.squadCard, animatedStyle]}>
        <LinearGradient
          colors={isCurrent ? [`${COLORS.PURPLE}20`, `${COLORS.PURPLE}05`] : [COLORS.MIDNIGHT_BLUE, COLORS.DEEP_PURPLE]}
          style={styles.squadCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isCurrent && <View style={[styles.squadActiveBorder, { borderColor: COLORS.PURPLE }]} />}

          <View style={styles.squadInfo}>
            <View style={[styles.squadIcon, { backgroundColor: `${COLORS.PURPLE}20` }]}>
              <Ionicons
                name={isCurrent ? "people" : "people-outline"}
                size={24}
                color={COLORS.PURPLE}
              />
            </View>
            <View style={styles.squadText}>
              <View style={styles.squadNameRow}>
                <Text style={styles.squadName}>{squad.name}</Text>
                {isCurrent && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              {isCurrent && squad.invite_code && (
                <Text style={styles.squadCode}>Code: {squad.invite_code}</Text>
              )}
            </View>
          </View>

          {isCurrent ? (
            <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
              <Ionicons name="exit-outline" size={18} color={COLORS.RED} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.switchBtn} onPress={onSwitch}>
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Danger Button Component
function DangerButton({ title, icon, onPress, delay = 0 }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  delay?: number;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        entering={FadeInDown.delay(delay).duration(300)}
        style={[styles.dangerButton, animatedStyle]}
      >
        <LinearGradient
          colors={[`${COLORS.RED}20`, `${COLORS.RED}10`]}
          style={styles.dangerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={icon} size={22} color={COLORS.RED} />
          <Text style={styles.dangerText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Main Settings Screen
export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, user, signOut, isLoading } = useAuthStore();
  const { currentSquad, squads, leaveSquad, setCurrentSquad } = useSquadStore();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleLeaveSquad = () => {
    if (!currentSquad) return;

    Alert.alert(
      t('squad.leaveSquad'),
      `${t('messages.confirmation.leaveSquad')} ${currentSquad.name}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('squad.leaveSquad'),
          style: 'destructive',
          onPress: async () => {
            await leaveSquad(currentSquad.id);
            if (squads.length <= 1) {
              router.replace('/(auth)/squad');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile or show modal
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        {/* Profile Card */}
        <ProfileCard
          profile={profile}
          user={user}
          onEditPress={handleEditProfile}
        />

        {/* Language Section */}
        <SectionHeader
          title={`${t('settings.language')} / Hebrew`}
          icon="globe-outline"
          color={COLORS.CYAN}
          delay={100}
        />
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <LanguageSelector />
        </Animated.View>

        {/* Squad Section */}
        <SectionHeader
          title={t('squad.title')}
          icon="people-outline"
          color={COLORS.PURPLE}
          delay={200}
        />

        {currentSquad && (
          <Animated.View entering={FadeInDown.delay(250).duration(300)}>
            <SquadCard
              squad={currentSquad}
              isCurrent={true}
              onLeave={handleLeaveSquad}
            />
          </Animated.View>
        )}

        {squads.filter((s) => s.id !== currentSquad?.id).map((squad, index) => (
          <Animated.View
            key={squad.id}
            entering={FadeInDown.delay(300 + index * 50).duration(300)}
          >
            <SquadCard
              squad={squad}
              isCurrent={false}
              onSwitch={() => setCurrentSquad(squad)}
            />
          </Animated.View>
        ))}

        {/* Add Squad Button */}
        <Animated.View entering={FadeInDown.delay(350).duration(300)}>
          <TouchableOpacity
            style={styles.addSquadButton}
            onPress={() => router.push('/(auth)/squad')}
          >
            <LinearGradient
              colors={[`${COLORS.PURPLE}20`, `${COLORS.PURPLE}05`]}
              style={styles.addSquadGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle-outline" size={22} color={COLORS.PURPLE} />
              <Text style={styles.addSquadText}>{t('squad.joinSquad')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Notifications Section */}
        <SectionHeader
          title={t('settings.notifications')}
          icon="notifications-outline"
          color={COLORS.ORANGE}
          delay={400}
        />
        <View style={styles.card}>
          <AnimatedRow
            icon="notifications"
            iconColor={COLORS.ORANGE}
            label="Push Notifications"
            isSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
            delay={450}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="volume-high"
            iconColor={COLORS.ORANGE}
            label="Sound Effects"
            isSwitch
            switchValue={soundEnabled}
            onSwitchChange={setSoundEnabled}
            delay={500}
          />
        </View>

        {/* Premium Section */}
        <SectionHeader
          title="Premium"
          icon="diamond-outline"
          color={COLORS.GOLD}
          delay={550}
        />
        <View style={styles.card}>
          <AnimatedRow
            icon="trophy"
            iconColor={COLORS.GOLD}
            label="Upgrade to Pro"
            value="Unlock all features"
            onPress={() => Alert.alert('Premium', 'Premium features coming soon!')}
            delay={600}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="gift"
            iconColor={COLORS.GOLD}
            label="Redeem Code"
            onPress={() => Alert.alert('Redeem', 'Enter your promo code')}
            delay={650}
          />
        </View>

        {/* Game Info Section */}
        <SectionHeader
          title={t('gameInfo.title')}
          icon="book-outline"
          color={COLORS.CYAN}
          delay={700}
        />
        <View style={styles.card}>
          <AnimatedRow
            icon="book"
            iconColor={COLORS.CYAN}
            label={t('gameInfo.rulebook')}
            value={t('gameInfo.rulebookDesc')}
            onPress={() => router.push('/squad/rulebook')}
            delay={720}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="flash"
            iconColor={COLORS.CYAN}
            label={t('gameInfo.judgeRole')}
            value={t('gameInfo.judgeRoleDesc')}
            onPress={() => router.push('/judge')}
            delay={740}
          />
        </View>

        {/* Help & Support Section */}
        <SectionHeader
          title={t('settings.help')}
          icon="help-circle-outline"
          color={COLORS.LIME}
          delay={760}
        />
        <View style={styles.card}>
          <AnimatedRow
            icon="help-buoy"
            iconColor={COLORS.LIME}
            label="Help Center"
            onPress={() => Alert.alert('Help', 'Help center coming soon!')}
            delay={780}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="chatbubble-ellipses"
            iconColor={COLORS.LIME}
            label="Contact Support"
            onPress={() => Alert.alert('Support', 'support@squadgame.com')}
            delay={800}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="document-text"
            iconColor={COLORS.LIME}
            label={t('settings.privacyPolicy')}
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
            delay={850}
          />
          <View style={styles.divider} />
          <AnimatedRow
            icon="information-circle"
            iconColor={COLORS.LIME}
            label="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of service coming soon!')}
            delay={900}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader
          title="Danger Zone"
          icon="warning-outline"
          color={COLORS.RED}
          delay={950}
        />
        <View style={styles.dangerZone}>
          <DangerButton
            title={t('settings.signOut')}
            icon="log-out-outline"
            onPress={handleSignOut}
            delay={1000}
          />
          <DangerButton
            title="Delete Account"
            icon="trash-outline"
            onPress={handleDeleteAccount}
            delay={1050}
          />
        </View>

        {/* Version Footer */}
        <Animated.View
          entering={FadeInDown.delay(1100).duration(300)}
          style={styles.footer}
        >
          <Text style={styles.version}>{t('settings.version')} 1.0.0</Text>
          <Text style={styles.copyright}>Made with passion for gaming</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_NAVY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Profile Card
  profileCardContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  profileDecorTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${COLORS.CYAN}10`,
  },
  profileDecorBottom: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.PURPLE}10`,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.DARK_NAVY,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.GOLD,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.DARK_NAVY,
  },
  levelText: {
    color: COLORS.DARK_NAVY,
    fontSize: 14,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.DARK_NAVY}80`,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.BORDER,
  },
  editProfileBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.CYAN}30`,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.CYAN,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 10,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    marginLeft: 8,
  },

  // Cards
  card: {
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DARK,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  rowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DARK,
    marginLeft: 72,
  },

  // Squad Card
  squadCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  squadCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DARK,
  },
  squadActiveBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
  },
  squadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  squadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadText: {
    flex: 1,
  },
  squadNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  activeBadge: {
    backgroundColor: `${COLORS.PURPLE}30`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.PURPLE,
    textTransform: 'uppercase',
  },
  squadCode: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginTop: 3,
  },
  leaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.RED}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBtn: {
    backgroundColor: COLORS.PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  switchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },

  // Add Squad Button
  addSquadButton: {
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
  },
  addSquadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  addSquadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PURPLE,
  },

  // Danger Zone
  dangerZone: {
    gap: 10,
  },
  dangerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.RED}30`,
  },
  dangerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.RED,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_DARK,
  },
  version: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
  },
  copyright: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
    opacity: 0.6,
  },
});

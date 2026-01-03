import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../src/components/Avatar';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { useAuthStore } from '../../src/store/authStore';
import { useSquadStore } from '../../src/store/squadStore';

// Colors matching the app theme
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ELECTRIC_PURPLE: '#9B59FF',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',
  BORDER: '#374151',
  DANGER: '#ef4444',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, user, signOut, isLoading } = useAuthStore();
  const { currentSquad, squads, leaveSquad, setCurrentSquad } = useSquadStore();

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.display_name}
            size="xlarge"
          />
          <Text style={styles.profileName}>{profile?.display_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={16} color={COLORS.ELECTRIC_PURPLE} />
            <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Language Section */}
        <Text style={styles.sectionTitle}>
          {t('settings.language')} / \u05E9\u05E4\u05D4
        </Text>
        <LanguageSelector />

        {/* Current Squad Section */}
        <Text style={styles.sectionTitle}>{t('squad.title')}</Text>
        {currentSquad && (
          <Card style={styles.squadCard}>
            <View style={styles.squadInfo}>
              <View style={styles.squadIcon}>
                <Ionicons name="people" size={24} color={COLORS.ELECTRIC_PURPLE} />
              </View>
              <View style={styles.squadText}>
                <Text style={styles.squadName}>{currentSquad.name}</Text>
                <Text style={styles.squadCode}>
                  {t('squad.squadCode')}: {currentSquad.invite_code}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveSquad}
            >
              <Text style={styles.leaveButtonText}>{t('squad.leaveSquad')}</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Other Squads */}
        {squads.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>{t('squad.title')}</Text>
            {squads
              .filter((s) => s.id !== currentSquad?.id)
              .map((squad) => (
                <Card key={squad.id} style={styles.squadCard}>
                  <View style={styles.squadInfo}>
                    <View style={styles.squadIcon}>
                      <Ionicons name="people-outline" size={24} color={COLORS.TEXT_MUTED} />
                    </View>
                    <View style={styles.squadText}>
                      <Text style={styles.squadName}>{squad.name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setCurrentSquad(squad)}
                  >
                    <Text style={styles.switchButtonText}>{t('common.confirm')}</Text>
                  </TouchableOpacity>
                </Card>
              ))}
          </>
        )}

        {/* Add Squad Button */}
        <TouchableOpacity
          style={styles.addSquadButton}
          onPress={() => router.push('/(auth)/squad')}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.ELECTRIC_PURPLE} />
          <Text style={styles.addSquadText}>{t('squad.joinSquad')}</Text>
        </TouchableOpacity>

        {/* Settings Options */}
        <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            <Text style={styles.settingText}>{t('settings.notifications')}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            <Text style={styles.settingText}>{t('settings.help')}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            <Text style={styles.settingText}>{t('settings.privacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title={t('settings.signOut')}
            onPress={handleSignOut}
            variant="danger"
            loading={isLoading}
          />
        </View>

        <Text style={styles.version}>{t('settings.version')} 1.0.0</Text>
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
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(155, 89, 255, 0.15)',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ELECTRIC_PURPLE,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  squadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadText: {
    flex: 1,
  },
  squadName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  squadCode: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  leaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DANGER,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.BORDER,
    borderRadius: 8,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  addSquadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  addSquadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ELECTRIC_PURPLE,
  },
  settingsCard: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginStart: 56,
  },
  signOutContainer: {
    marginTop: 32,
  },
  version: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
});

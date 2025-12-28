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
import { Avatar } from '../../src/components/Avatar';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';
import { useSquadStore } from '../../src/store/squadStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user, signOut, isLoading } = useAuthStore();
  const { currentSquad, squads, leaveSquad, setCurrentSquad } = useSquadStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleLeaveSquad = () => {
    if (!currentSquad) return;

    Alert.alert(
      'Leave Squad',
      `Are you sure you want to leave ${currentSquad.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <Ionicons name="pencil" size={16} color="#6366f1" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Current Squad Section */}
        <Text style={styles.sectionTitle}>Current Squad</Text>
        {currentSquad && (
          <Card style={styles.squadCard}>
            <View style={styles.squadInfo}>
              <View style={styles.squadIcon}>
                <Ionicons name="people" size={24} color="#6366f1" />
              </View>
              <View style={styles.squadText}>
                <Text style={styles.squadName}>{currentSquad.name}</Text>
                <Text style={styles.squadCode}>
                  Code: {currentSquad.invite_code}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveSquad}
            >
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Other Squads */}
        {squads.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Other Squads</Text>
            {squads
              .filter((s) => s.id !== currentSquad?.id)
              .map((squad) => (
                <Card key={squad.id} style={styles.squadCard}>
                  <View style={styles.squadInfo}>
                    <View style={styles.squadIcon}>
                      <Ionicons name="people-outline" size={24} color="#6b7280" />
                    </View>
                    <View style={styles.squadText}>
                      <Text style={styles.squadName}>{squad.name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setCurrentSquad(squad)}
                  >
                    <Text style={styles.switchButtonText}>Switch</Text>
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
          <Ionicons name="add-circle" size={20} color="#6366f1" />
          <Text style={styles.addSquadText}>Join or Create Squad</Text>
        </TouchableOpacity>

        {/* Settings Options */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            loading={isLoading}
          />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
    color: '#fff',
    marginTop: 16,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadText: {
    flex: 1,
  },
  squadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  squadCode: {
    fontSize: 12,
    color: '#6b7280',
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
    color: '#ef4444',
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  addSquadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  addSquadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
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
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginStart: 56,
  },
  signOutContainer: {
    marginTop: 32,
  },
  version: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
});

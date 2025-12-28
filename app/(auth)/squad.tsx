import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useSquadStore } from '../../src/store/squadStore';

type Mode = 'choose' | 'create' | 'join';

export default function SquadScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const [squadName, setSquadName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const { createSquad, joinSquad, isLoading } = useSquadStore();
  const router = useRouter();

  const handleCreate = async () => {
    if (!squadName.trim() || squadName.length < 2) {
      setError('Squad name must be at least 2 characters');
      return;
    }

    setError('');
    const timezone = Localization.timezone || 'UTC';
    const { error } = await createSquad(squadName.trim(), timezone);

    if (error) {
      setError(error.message);
    } else {
      router.replace('/');
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      setError('Enter a valid 6-character invite code');
      return;
    }

    setError('');
    const { error } = await joinSquad(inviteCode.trim().toUpperCase());

    if (error) {
      setError(error.message);
    } else {
      router.replace('/');
    }
  };

  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="people" size={48} color="#6366f1" />
            <Text style={styles.title}>Join or Create a Squad</Text>
            <Text style={styles.subtitle}>
              Squads are your friend groups for daily games
            </Text>
          </View>

          <View style={styles.options}>
            <TouchableOpacity onPress={() => setMode('create')}>
              <Card style={styles.optionCard}>
                <View style={styles.optionIcon}>
                  <Ionicons name="add-circle" size={32} color="#10b981" />
                </View>
                <Text style={styles.optionTitle}>Create a Squad</Text>
                <Text style={styles.optionDesc}>
                  Start a new squad and invite friends
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode('join')}>
              <Card style={styles.optionCard}>
                <View style={styles.optionIcon}>
                  <Ionicons name="enter" size={32} color="#6366f1" />
                </View>
                <Text style={styles.optionTitle}>Join a Squad</Text>
                <Text style={styles.optionDesc}>
                  Enter an invite code from a friend
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const formContent = (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setMode('choose');
            setError('');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons
            name={mode === 'create' ? 'add-circle' : 'enter'}
            size={48}
            color={mode === 'create' ? '#10b981' : '#6366f1'}
          />
          <Text style={styles.title}>
            {mode === 'create' ? 'Create Your Squad' : 'Join a Squad'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'create'
              ? 'Give your squad a name'
              : 'Enter the invite code'}
          </Text>
        </View>

        <View style={styles.form}>
          {mode === 'create' ? (
            <>
              <Input
                label="Squad Name"
                placeholder="The Legends"
                value={squadName}
                onChangeText={setSquadName}
                maxLength={30}
                error={error}
              />
              <Button
                title="Create Squad"
                onPress={handleCreate}
                loading={isLoading}
                size="large"
              />
            </>
          ) : (
            <>
              <Input
                label="Invite Code"
                placeholder="ABC123"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                error={error}
              />
              <Button
                title="Join Squad"
                onPress={handleJoin}
                loading={isLoading}
                size="large"
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // On web, don't wrap with Pressable (blocks input focus)
  if (Platform.OS === 'web') {
    return formContent;
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      {formContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 0,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#9ca3af',
  },
  form: {
    gap: 16,
  },
});

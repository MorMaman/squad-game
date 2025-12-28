import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useEventStore } from '../../src/store/eventStore';
import { uploadEventMedia } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

type Phase = 'countdown' | 'capture' | 'micropoll' | 'submitting';

const COUNTDOWN_SECONDS = 10;

const MICRO_POLL_QUESTIONS = [
  {
    question: 'How are you feeling right now?',
    options: ['Great', 'Good', 'Meh', 'Tired'],
  },
  {
    question: 'What are you up to?',
    options: ['Working', 'Relaxing', 'With friends', 'Eating'],
  },
  {
    question: 'Quick mood check:',
    options: ['Happy', 'Stressed', 'Chill', 'Energized'],
  },
];

export default function LiveSelfieScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const { todayEvent, submitEvent, isLoading } = useEventStore();
  const { user } = useAuthStore();

  const microPoll = MICRO_POLL_QUESTIONS[Math.floor(Math.random() * MICRO_POLL_QUESTIONS.length)];

  useEffect(() => {
    if (phase !== 'countdown') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          takePicture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        setCapturedPhoto(photo.base64);
        setPhase('micropoll');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!todayEvent.event || !capturedPhoto || !user) return;

    setPhase('submitting');

    try {
      // Upload media
      const mediaPath = await uploadEventMedia(
        todayEvent.event.id,
        user.id,
        capturedPhoto
      );

      // Submit event
      const { error } = await submitEvent(
        todayEvent.event.id,
        {
          captured_at: new Date().toISOString(),
          countdown_used: true,
          micro_poll_answer: selectedAnswer,
          device_info: Platform.OS,
        },
        mediaPath || undefined
      );

      if (error) {
        Alert.alert('Error', error.message);
        setPhase('micropoll');
      } else {
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit. Please try again.');
      setPhase('micropoll');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#6b7280" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture your live selfie
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'micropoll' || phase === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.microPollContainer}>
          <View style={styles.photoPreview}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.photoText}>Photo captured!</Text>
          </View>

          <Card style={styles.pollCard}>
            <Text style={styles.pollQuestion}>{microPoll.question}</Text>
            <View style={styles.pollOptions}>
              {microPoll.options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.pollOption,
                    selectedAnswer === option && styles.pollOptionSelected,
                  ]}
                  onPress={() => setSelectedAnswer(option)}
                  disabled={phase === 'submitting'}
                >
                  <Text
                    style={[
                      styles.pollOptionText,
                      selectedAnswer === option && styles.pollOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Button
            title={phase === 'submitting' ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            loading={phase === 'submitting'}
            disabled={!selectedAnswer}
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <SafeAreaView style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.countdownContainer}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </View>
            <Text style={styles.countdownText}>
              Get ready for your selfie!
            </Text>
          </View>

          <View style={styles.instructions}>
            <View style={styles.instructionBadge}>
              <Ionicons name="information-circle" size={16} color="#fbbf24" />
              <Text style={styles.instructionText}>
                Photo will be taken automatically
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructions: {
    alignItems: 'center',
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  microPollContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  photoPreview: {
    alignItems: 'center',
    gap: 8,
  },
  photoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  pollCard: {
    padding: 24,
  },
  pollQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  pollOptions: {
    gap: 12,
  },
  pollOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pollOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  pollOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  pollOptionTextSelected: {
    color: '#6366f1',
  },
});

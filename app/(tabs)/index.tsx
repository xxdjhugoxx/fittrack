import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../src/contexts/LocationContext';
import { useWorkout } from '../../src/contexts/WorkoutContext';
import {
  formatDuration,
  formatPace,
  formatDistanceMeters,
  formatDistanceKm,
} from '../../src/utils/formatters';

export default function HomeScreen() {
  const router = useRouter();
  const { permissionStatus, requestPermission, isLoading } = useLocation();
  const {
    isTracking,
    currentRoute,
    currentDistance,
    currentDuration,
    currentPace,
    startWorkout,
    stopWorkout,
    isBackgroundTracking,
  } = useWorkout();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayDuration, setDisplayDuration] = React.useState(0);

  // Live duration ticker
  useEffect(() => {
    if (isTracking) {
      const start = Date.now() - currentDuration * 1000;
      timerRef.current = setInterval(() => {
        setDisplayDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, currentDuration]);

  const handleStartPress = useCallback(async () => {
    // If already tracking, stop
    if (isTracking) {
      const workout = await stopWorkout(true);
      if (workout) {
        router.push(`/workout/${workout.id}`);
      }
      return;
    }

    // Permission check — only ask when user actually taps Start
    if (permissionStatus === 'undetermined') {
      // Show explanation modal first
      Alert.alert(
        '📍 Location Access Needed',
        'FitTrack needs access to your location to track your workout route. We\'ll also ask for background access to keep tracking when your screen is off.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Location',
            onPress: async () => {
              const granted = await requestPermission();
              if (granted) {
                await startWorkout();
              } else {
                Alert.alert(
                  'Location Denied',
                  'Please enable location access in Settings to track your workout.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
      return;
    }

    if (permissionStatus === 'denied') {
      Alert.alert(
        '📍 Location Access Required',
        'FitTrack needs location access to track your workout. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    // Permission granted — start immediately
    await startWorkout();
  }, [isTracking, permissionStatus, requestPermission, startWorkout, stopWorkout, router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitTrack</Text>
        <Text style={styles.headerSubtitle}>Running & Walking Tracker</Text>
      </View>

      {/* Live Stats */}
      {isTracking && (
        <View style={styles.statsContainer}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>
              {formatDistanceKm(currentDistance)}
            </Text>
            <Text style={styles.mainStatLabel}>km</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(displayDuration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatPace(currentPace)}</Text>
              <Text style={styles.statLabel}>min/km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDistanceMeters(currentDistance)}</Text>
              <Text style={styles.statLabel}>miles</Text>
            </View>
          </View>

          {/* Background indicator */}
          {isBackgroundTracking && (
            <View style={styles.backgroundBadge}>
              <Text style={styles.backgroundBadgeText}>● Background tracking ON</Text>
            </View>
          )}

          {/* Route preview dots */}
          {currentRoute.length > 0 && (
            <Text style={styles.routePoints}>
              {currentRoute.length} route points recorded
            </Text>
          )}
        </View>
      )}

      {/* Empty state */}
      {!isTracking && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏃</Text>
          <Text style={styles.emptyTitle}>Ready to move?</Text>
          <Text style={styles.emptySubtitle}>
            Tap the button below to start tracking your workout
          </Text>
        </View>
      )}

      {/* Main CTA Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            isTracking ? styles.stopButton : styles.startButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleStartPress}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.mainButtonText}>
            {isLoading
              ? '...'
              : isTracking
              ? '■ STOP WORKOUT'
              : '▶ START TRACKING'}
          </Text>
        </TouchableOpacity>

        {isTracking && (
          <Text style={styles.tapToStop}>Tap to finish and save workout</Text>
        )}
      </View>

      {/* Permission hint */}
      {!isTracking && permissionStatus === 'denied' && (
        <TouchableOpacity
          style={styles.settingsHint}
          onPress={() => router.push('/tabs/settings')}
        >
          <Text style={styles.settingsHintText}>
            ⚠ Location disabled — tap to fix in Settings
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 28,
    marginTop: 10,
    alignItems: 'center',
  },
  mainStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  mainStatValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#00D4AA',
    letterSpacing: -3,
  },
  mainStatLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
  },
  backgroundBadge: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backgroundBadgeText: {
    color: '#00D4AA',
    fontSize: 12,
    fontWeight: '600',
  },
  routePoints: {
    color: '#444444',
    fontSize: 11,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    alignItems: 'center',
  },
  mainButton: {
    width: '100%',
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#00D4AA',
  },
  stopButton: {
    backgroundColor: '#FF4757',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 1,
  },
  tapToStop: {
    color: '#666666',
    fontSize: 12,
    marginTop: 12,
  },
  settingsHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 160 : 150,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  settingsHintText: {
    color: '#FF4757',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

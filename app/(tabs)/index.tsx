import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Animated,
  Easing,
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

type Activity = 'running' | 'walking';

export default function HomeScreen() {
  const router = useRouter();
  const { permissionStatus, requestPermission } = useLocation();
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

  const [activity, setActivity] = useState<Activity>('running');
  const [displayDuration, setDisplayDuration] = useState(0);

  // Pulse animation for the tracking button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Live duration ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTracking) {
      const start = Date.now() - currentDuration * 1000;
      interval = setInterval(() => {
        setDisplayDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ).start();
    } else {
      if (interval) clearInterval(interval);
      setDisplayDuration(0);
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentDuration]);

  const handleActivitySelect = useCallback((a: Activity) => {
    if (!isTracking) setActivity(a);
  }, [isTracking]);

  const handleStartPress = useCallback(async () => {
    if (isTracking) {
      const workout = await stopWorkout(true);
      if (workout) {
        router.push(`/workout/${workout.id}`);
      }
      return;
    }

    if (permissionStatus === 'undetermined') {
      Alert.alert(
        '📍 Location Access Needed',
        'FitTrack needs your location to record your workout route. We\'ll also ask for background access to keep tracking when your screen is off.',
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
                  '⚠️ Location Denied',
                  'Please enable location in your device settings to track workouts.',
                  [{ text: 'OK', onPress: () => router.push('/(tabs)/settings') }]
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
        '🔒 Location Access Required',
        'FitTrack needs location access to track your workout. Please enable it in Settings.',
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

    await startWorkout();
  }, [isTracking, permissionStatus, requestPermission, startWorkout, stopWorkout, router]);

  const km = currentDistance / 1000;
  const miles = currentDistance / 1609.344;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitTrack</Text>
        <Text style={styles.headerSubtitle}>Your personal running coach</Text>
      </View>

      {/* Activity Selector */}
      {!isTracking && (
        <View style={styles.activitySelector}>
          <TouchableOpacity
            style={[styles.activityBtn, activity === 'running' && styles.activityBtnActive]}
            onPress={() => handleActivitySelect('running')}
            activeOpacity={0.7}
          >
            <Text style={styles.activityIcon}>🏃</Text>
            <Text style={[styles.activityLabel, activity === 'running' && styles.activityLabelActive]}>
              Running
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.activityBtn, activity === 'walking' && styles.activityBtnActive]}
            onPress={() => handleActivitySelect('walking')}
            activeOpacity={0.7}
          >
            <Text style={styles.activityIcon}>🚶</Text>
            <Text style={[styles.activityLabel, activity === 'walking' && styles.activityLabelActive]}>
              Walking
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live Stats Card */}
      <View style={styles.statsCard}>
        {/* Main distance */}
        <View style={styles.mainStat}>
          {isTracking ? (
            <>
              <Text style={styles.mainStatValue}>{km.toFixed(2)}</Text>
              <Text style={styles.mainStatUnit}>km</Text>
            </>
          ) : (
            <>
              <Text style={styles.mainStatValue}>0.00</Text>
              <Text style={styles.mainStatUnit}>km</Text>
            </>
          )}
        </View>

        {/* Pace + Duration row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {isTracking ? formatDuration(displayDuration) : '00:00'}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {isTracking && currentPace > 0 ? formatPace(currentPace) : '--:--'}
            </Text>
            <Text style={styles.statLabel}>min / km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {isTracking ? miles.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.statLabel}>miles</Text>
          </View>
        </View>

        {/* Route points indicator */}
        {isTracking && currentRoute.length > 0 && (
          <View style={styles.routeIndicator}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText}>{currentRoute.length} GPS points recorded</Text>
          </View>
        )}
      </View>

      {/* Background badge */}
      {isBackgroundTracking && (
        <View style={styles.backgroundBadge}>
          <Text style={styles.backgroundBadgeText}>● Background tracking ON</Text>
        </View>
      )}

      {/* Empty state illustration */}
      {!isTracking && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏃‍♂️</Text>
          <Text style={styles.emptyTitle}>Ready to move?</Text>
          <Text style={styles.emptySubtitle}>
            Select your activity and tap the button to start tracking your {activity}
          </Text>
        </View>
      )}

      {/* Main CTA Button */}
      <View style={styles.buttonArea}>
        {/* Glow effect behind button */}
        {isTracking && (
          <Animated.View
            style={[
              styles.buttonGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              isTracking ? styles.stopButton : activity === 'running' ? styles.startButtonRun : styles.startButtonWalk,
            ]}
            onPress={handleStartPress}
            activeOpacity={0.85}
          >
            <Text style={styles.mainButtonText}>
              {isTracking ? '■ STOP' : '▶ START'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isTracking && (
          <Text style={styles.tapHint}>Tap to finish and save workout</Text>
        )}
      </View>

      {/* Bottom safe area */}
      <View style={styles.bottomSafe} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090910',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#5A5A6E',
    marginTop: 2,
    fontWeight: '500',
  },
  activitySelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  activityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14141C',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#1E1E2C',
  },
  activityBtnActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#00D4AA',
  },
  activityIcon: {
    fontSize: 18,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A5A6E',
  },
  activityLabelActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#14141C',
    borderRadius: 24,
    padding: 28,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  mainStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  mainStatValue: {
    fontSize: 76,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -4,
    includeFontPadding: false,
  },
  mainStatUnit: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5A5A6E',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#5A5A6E',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#1E1E2C',
  },
  routeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D4AA',
  },
  routeText: {
    fontSize: 11,
    color: '#3A3A4E',
    fontWeight: '500',
  },
  backgroundBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  backgroundBadgeText: {
    color: '#00D4AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5A5A6E',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  buttonArea: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  buttonGlow: {
    position: 'absolute',
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF4757',
  },
  mainButton: {
    width: 200,
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  startButtonRun: {
    backgroundColor: '#00D4AA',
    shadowColor: '#00D4AA',
  },
  startButtonWalk: {
    backgroundColor: '#FF9F43',
    shadowColor: '#FF9F43',
  },
  stopButton: {
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
  },
  mainButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#090910',
    letterSpacing: 2,
  },
  tapHint: {
    color: '#5A5A6E',
    fontSize: 12,
    marginTop: 14,
    fontWeight: '500',
  },
  bottomSafe: {
    height: 20,
  },
});

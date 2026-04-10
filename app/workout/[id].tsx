import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWorkout } from '../../src/contexts/WorkoutContext';
import {
  formatDuration,
  formatPace,
  formatDistanceKm,
  formatDistanceMeters,
  formatDateTime,
  formatSpeedMps,
} from '../../src/utils/formatters';
import { Workout } from '../../src/types';

const { width } = Dimensions.get('window');

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWorkoutById } = useWorkout();
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (id) {
      const found = getWorkoutById(id);
      setWorkout(found);
    }
  }, [id, getWorkoutById]);

  if (!workout) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Workout not found</Text>
        </View>
      </View>
    );
  }

  const route = workout.route || [];

  return (
    <View style={styles.container}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsHeader}>
          <Text style={styles.workoutType}>
            {workout.isRunning ? '🏃 Running' : '🚶 Walking'}
          </Text>
          <Text style={styles.workoutDate}>{formatDateTime(workout.date)}</Text>
        </View>

        {/* Primary stat */}
        <View style={styles.primaryStats}>
          <View style={styles.primaryStat}>
            <Text style={styles.primaryStatValue}>{formatDistanceKm(workout.distance)}</Text>
            <Text style={styles.primaryStatLabel}>kilometers</Text>
          </View>
          <View style={styles.primaryStatDivider} />
          <View style={styles.primaryStat}>
            <Text style={styles.primaryStatValue}>{formatDistanceMeters(workout.distance)}</Text>
            <Text style={styles.primaryStatLabel}>miles</Text>
          </View>
        </View>

        {/* Secondary stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{formatDuration(workout.duration)}</Text>
            <Text style={styles.statCardLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{formatPace(workout.avgPace)}</Text>
            <Text style={styles.statCardLabel}>Avg Pace /km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{formatSpeedMps(workout.avgSpeed)}</Text>
            <Text style={styles.statCardLabel}>mph</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{workout.calories || 0}</Text>
            <Text style={styles.statCardLabel}>Calories</Text>
          </View>
        </View>

        {/* Route info */}
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoTitle}>📍 Route Details</Text>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Start point</Text>
            <Text style={styles.routeInfoValue}>
              {route.length > 0
                ? `${route[0].latitude.toFixed(5)}, ${route[0].longitude.toFixed(5)}`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>End point</Text>
            <Text style={styles.routeInfoValue}>
              {route.length > 1
                ? `${route[route.length - 1].latitude.toFixed(5)}, ${route[route.length - 1].longitude.toFixed(5)}`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Route points</Text>
            <Text style={styles.routeInfoValue}>{route.length} recorded</Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Total distance</Text>
            <Text style={styles.routeInfoValue}>{formatDistanceKm(workout.distance)} km</Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Avg speed</Text>
            <Text style={styles.routeInfoValue}>{formatSpeedMps(workout.avgSpeed)} mph</Text>
          </View>
        </View>

        {/* Raw route coordinates */}
        {route.length > 0 && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeInfoTitle}>🗺 Route Coordinates</Text>
            <Text style={styles.coordNote}>
              {route.length} GPS points recorded during this workout
            </Text>
            {route.slice(0, 10).map((point, i) => (
              <View key={i} style={styles.coordRow}>
                <Text style={styles.coordIndex}>#{i + 1}</Text>
                <Text style={styles.coordText}>
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </Text>
              </View>
            ))}
            {route.length > 10 && (
              <Text style={styles.coordNote}>
                ...and {route.length - 10} more points
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  backBtn: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsHeader: {
    marginBottom: 20,
  },
  workoutType: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666666',
  },
  primaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  primaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  primaryStatValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00D4AA',
    letterSpacing: -2,
  },
  primaryStatLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    width: (width - 48 - 12) / 2,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeInfo: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  routeInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  routeInfoLabel: {
    fontSize: 13,
    color: '#666666',
  },
  routeInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coordNote: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  coordIndex: {
    fontSize: 11,
    color: '#00D4AA',
    fontWeight: '700',
    width: 30,
  },
  coordText: {
    fontSize: 11,
    color: '#888888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
  },
});

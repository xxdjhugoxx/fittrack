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

// Simple ASCII-style route visualization
function RouteViz({ route }: { route: { latitude: number; longitude: number }[] }) {
  if (route.length === 0) return null;

  // Show start/end coordinates prominently
  const start = route[0];
  const end = route[route.length - 1];
  const mid = route[Math.floor(route.length / 2)];

  return (
    <View style={styles.routeViz}>
      <View style={styles.routeVizHeader}>
        <Text style={styles.routeVizTitle}>🗺 Route Trace</Text>
        <Text style={styles.routeVizCount}>{route.length} GPS points</Text>
      </View>

      {/* Visual route line */}
      <View style={styles.routeLine}>
        <View style={[styles.routePoint, styles.routePointStart]}>
          <Text style={styles.routePointLabel}>START</Text>
          <Text style={styles.routePointCoords}>
            {start.latitude.toFixed(4)}, {start.longitude.toFixed(4)}
          </Text>
        </View>
        <View style={styles.routeLineBar}>
          <View style={styles.routeLineFill} />
          <View style={styles.routeLineDot} />
        </View>
        <View style={[styles.routePoint, styles.routePointEnd]}>
          <Text style={styles.routePointLabel}>FINISH</Text>
          <Text style={styles.routePointCoords}>
            {end.latitude.toFixed(4)}, {end.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Middle point */}
      {route.length > 2 && (
        <View style={styles.midPoint}>
          <Text style={styles.midPointLabel}>Mid point</Text>
          <Text style={styles.midPointCoords}>
            {mid.latitude.toFixed(5)}, {mid.longitude.toFixed(5)}
          </Text>
        </View>
      )}

      {/* All coordinates expandable */}
      <View style={styles.coordList}>
        {route.slice(0, 20).map((pt, i) => (
          <View key={i} style={styles.coordRow}>
            <Text style={styles.coordIndex}>#{i + 1}</Text>
            <Text style={styles.coordText}>
              {pt.latitude.toFixed(6)}, {pt.longitude.toFixed(6)}
            </Text>
          </View>
        ))}
        {route.length > 20 && (
          <Text style={styles.coordMore}>
            ...and {route.length - 20} more coordinates
          </Text>
        )}
      </View>
    </View>
  );
}

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
  const km = workout.distance / 1000;
  const miles = workout.distance / 1609.344;

  return (
    <View style={styles.container}>
      {/* Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Activity + Date */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.activityIcon}>{workout.isRunning ? '🏃' : '🚶'}</Text>
            <View>
              <Text style={styles.activityType}>
                {workout.isRunning ? 'Running' : 'Walking'}
              </Text>
              <Text style={styles.dateText}>{formatDateTime(workout.date)}</Text>
            </View>
          </View>
        </View>

        {/* Primary distance card */}
        <View style={styles.primaryCard}>
          <View style={styles.primaryStat}>
            <Text style={styles.primaryValue}>{km.toFixed(2)}</Text>
            <Text style={styles.primaryUnit}>kilometers</Text>
          </View>
          <View style={styles.primaryDivider} />
          <View style={styles.primaryStat}>
            <Text style={styles.primaryValue}>{miles.toFixed(2)}</Text>
            <Text style={styles.primaryUnit}>miles</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCardIcon}>⏱</Text>
            <Text style={styles.statCardValue}>{formatDuration(workout.duration)}</Text>
            <Text style={styles.statCardLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardIcon}>⚡</Text>
            <Text style={styles.statCardValue}>{formatPace(workout.avgPace)}</Text>
            <Text style={styles.statCardLabel}>Avg Pace /km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardIcon}>🚀</Text>
            <Text style={styles.statCardValue}>{formatSpeedMps(workout.avgSpeed)}</Text>
            <Text style={styles.statCardLabel}>mph</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardIcon}>🔥</Text>
            <Text style={styles.statCardValue}>{workout.calories || 0}</Text>
            <Text style={styles.statCardLabel}>Calories</Text>
          </View>
        </View>

        {/* Route visualization */}
        {route.length > 0 && <RouteViz route={route} />}

        {/* Extra metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>📊 Detailed Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total distance</Text>
            <Text style={styles.metricValue}>{(workout.distance).toFixed(0)} m</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average speed</Text>
            <Text style={styles.metricValue}>{workout.avgSpeed.toFixed(2)} m/s</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average pace</Text>
            <Text style={styles.metricValue}>{formatPace(workout.avgPace)} /km</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>GPS points recorded</Text>
            <Text style={styles.metricValue}>{route.length}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090910',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  backBtnWrapper: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
  },
  backBtn: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  titleBlock: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    fontSize: 32,
  },
  activityType: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  dateText: {
    fontSize: 14,
    color: '#5A5A6E',
    marginTop: 2,
  },
  primaryCard: {
    backgroundColor: '#14141C',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  primaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  primaryValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#00D4AA',
    letterSpacing: -2,
  },
  primaryUnit: {
    fontSize: 12,
    color: '#5A5A6E',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#1E1E2C',
    marginHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    width: (width - 48 - 12) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  statCardIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#5A5A6E',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeViz: {
    backgroundColor: '#14141C',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  routeVizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  routeVizTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  routeVizCount: {
    fontSize: 12,
    color: '#5A5A6E',
    backgroundColor: '#1E1E2C',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routePoint: {
    flex: 1,
  },
  routePointStart: {
    alignItems: 'flex-start',
  },
  routePointEnd: {
    alignItems: 'flex-end',
  },
  routePointLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00D4AA',
    letterSpacing: 1,
    marginBottom: 4,
  },
  routePointCoords: {
    fontSize: 10,
    color: '#5A5A6E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  routeLineBar: {
    width: 40,
    height: 2,
    backgroundColor: '#1E1E2C',
    marginHorizontal: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  routeLineFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    backgroundColor: '#00D4AA',
    borderRadius: 1,
  },
  routeLineDot: {
    position: 'absolute',
    right: 0,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  midPoint: {
    alignItems: 'center',
    marginBottom: 12,
  },
  midPointLabel: {
    fontSize: 9,
    color: '#5A5A6E',
    marginBottom: 2,
  },
  midPointCoords: {
    fontSize: 10,
    color: '#5A5A6E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  coordList: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E2C',
    paddingTop: 12,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  coordIndex: {
    fontSize: 9,
    color: '#00D4AA',
    fontWeight: '700',
    width: 28,
  },
  coordText: {
    fontSize: 10,
    color: '#3A3A4E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  coordMore: {
    fontSize: 11,
    color: '#5A5A6E',
    marginTop: 8,
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: '#14141C',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  metricsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2C',
  },
  metricLabel: {
    fontSize: 13,
    color: '#5A5A6E',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#5A5A6E',
    fontSize: 16,
  },
});

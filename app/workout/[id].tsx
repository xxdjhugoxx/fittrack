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
import MapView, { Polyline, Marker } from 'react-native-maps';
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

const MAP_HEIGHT = 280;

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

  // Calculate map region from route
  const route = workout.route || [];
  const initialRegion = route.length > 0
    ? {
        latitude: route[0].latitude,
        longitude: route[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: -23.55,
        longitude: -46.63,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          mapType={Platform.OS === 'ios' ? 'standard' : 'standard'}
        >
          {route.length > 1 && (
            <Polyline
              coordinates={route}
              strokeColor="#00D4AA"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {route.length > 0 && (
            <>
              <Marker
                coordinate={route[0]}
                title="Start"
                pinColor="#00D4AA"
              />
              {route.length > 1 && (
                <Marker
                  coordinate={route[route.length - 1]}
                  title="Finish"
                  pinColor="#FF4757"
                />
              )}
            </>
          )}
        </MapView>

        {/* Back button overlay */}
        <TouchableOpacity
          style={styles.mapBackBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.mapBackText}>← Back</Text>
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
          <Text style={styles.routeInfoTitle}>Route</Text>
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
        </View>
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
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    zIndex: 10,
  },
  backBtn: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: MAP_HEIGHT,
    backgroundColor: '#1A1A1A',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
    marginBottom: 40,
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

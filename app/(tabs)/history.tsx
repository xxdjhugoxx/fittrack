import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkout } from '../../src/contexts/WorkoutContext';
import {
  formatDuration,
  formatPace,
  formatDistanceKm,
  formatDate,
} from '../../src/utils/formatters';
import { Workout } from '../../src/types';

function WorkoutCard({ workout, onPress, onDelete }: { workout: Workout; onPress: () => void; onDelete: () => void }) {
  const km = workout.distance / 1000;
  const miles = workout.distance / 1609.344;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, workout.isRunning ? styles.accentRun : styles.accentWalk]} />

      {/* Main content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.activityIcon}>{workout.isRunning ? '🏃' : '🚶'}</Text>
            <View>
              <Text style={styles.activityType}>{workout.isRunning ? 'Running' : 'Walking'}</Text>
              <Text style={styles.dateText}>{formatDate(workout.date)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert('Delete Workout', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.moreBtnText}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{km.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(workout.avgPace)}</Text>
            <Text style={styles.statLabel}>/km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{miles.toFixed(2)}</Text>
            <Text style={styles.statLabel}>mi</Text>
          </View>
        </View>

        {/* Route points */}
        {workout.route.length > 0 && (
          <View style={styles.routeChip}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText}>{workout.route.length} GPS points</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { workouts, deleteWorkout } = useWorkout();

  const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
  const totalWorkouts = workouts.length;
  const totalTime = workouts.reduce((sum, w) => sum + w.duration, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>
          {totalWorkouts} {totalWorkouts === 1 ? 'workout' : 'workouts'} recorded
        </Text>
      </View>

      {/* Summary bar */}
      {totalWorkouts > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{(totalDistance / 1000).toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>km total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.summaryLabel}>time total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalWorkouts}</Text>
            <Text style={styles.summaryLabel}>{totalWorkouts === 1 ? 'workout' : 'workouts'}</Text>
          </View>
        </View>
      )}

      {totalWorkouts === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete your first workout and it will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => router.push(`/workout/${item.id}`)}
              onDelete={() => deleteWorkout(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingBottom: 16,
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
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00D4AA',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#5A5A6E',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#1E1E2C',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#14141C',
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  accentBar: {
    width: 4,
  },
  accentRun: {
    backgroundColor: '#00D4AA',
  },
  accentWalk: {
    backgroundColor: '#FF9F43',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIcon: {
    fontSize: 22,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#5A5A6E',
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },
  moreBtnText: {
    color: '#3A3A4E',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#5A5A6E',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E1E2C',
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: '#1E1E2C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  routeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00D4AA',
  },
  routeText: {
    fontSize: 10,
    color: '#5A5A6E',
    fontWeight: '500',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 56,
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
    maxWidth: 240,
    lineHeight: 20,
  },
});

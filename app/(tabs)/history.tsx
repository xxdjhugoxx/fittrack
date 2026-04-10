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
  formatDistanceMeters,
  formatDate,
} from '../../src/utils/formatters';
import { Workout } from '../../src/types';

function WorkoutItem({ workout, onPress, onDelete }: { workout: Workout; onPress: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity style={styles.workoutItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.workoutItemLeft}>
        <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
        <View style={styles.workoutTags}>
          <View style={[styles.tag, workout.isRunning ? styles.tagRun : styles.tagWalk]}>
            <Text style={styles.tagText}>{workout.isRunning ? '🏃 Running' : '🚶 Walking'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.workoutItemRight}>
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatValue}>{formatDistanceKm(workout.distance)}</Text>
          <Text style={styles.workoutStatLabel}>km</Text>
        </View>
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatValue}>{formatDuration(workout.duration)}</Text>
          <Text style={styles.workoutStatLabel}>time</Text>
        </View>
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatValue}>{formatPace(workout.avgPace)}</Text>
          <Text style={styles.workoutStatLabel}>/km</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={(e) => {
          e.stopPropagation();
          Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { workouts, deleteWorkout } = useWorkout();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout History</Text>
        <Text style={styles.headerSubtitle}>
          {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} recorded
        </Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
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
            <WorkoutItem
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
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
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
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  workoutItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutItemLeft: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  workoutTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagRun: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
  },
  tagWalk: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutItemRight: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 12,
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workoutStatLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '700',
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
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
});

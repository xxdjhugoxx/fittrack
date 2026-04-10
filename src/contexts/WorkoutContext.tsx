import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import { Workout, LatLng, ActiveWorkout } from '../types';
import {
  estimateCalories,
  calculatePace,
  calculateSpeed,
} from '../utils/formatters';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  LOCATION_TASK_NAME,
} from '../services/locationService';

const WORKOUTS_STORAGE_KEY = '@fittrack_workouts';

interface WorkoutContextValue {
  workouts: Workout[];
  activeWorkout: ActiveWorkout | null;
  isTracking: boolean;
  currentRoute: LatLng[];
  currentDistance: number;
  currentDuration: number;
  currentPace: number;
  startWorkout: () => Promise<void>;
  stopWorkout: (isRunning: boolean) => Promise<Workout | null>;
  deleteWorkout: (id: string) => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;
  isBackgroundTracking: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<LatLng[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [currentPace, setCurrentPace] = useState<number>(0);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const routeRef = useRef<LatLng[]>([]);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);

  // ─── Register background task ───────────────────────────────────────────────
  useEffect(() => {
    console.log('[WorkoutContext] Registering background task:', LOCATION_TASK_NAME);

    TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
      if (error) {
        console.error('[WorkoutContext] Background location error:', error);
        return;
      }
      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[locations.length - 1];
        if (location) {
          const newPoint: LatLng = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          routeRef.current = [...routeRef.current, newPoint];
          setCurrentRoute([...routeRef.current]);

          // Calculate distance from last point
          if (lastLocationRef.current) {
            const last = lastLocationRef.current.coords;
            const dx = (newPoint.latitude - last.latitude) * (Math.PI / 180) * 6371000;
            const dy = (newPoint.longitude - last.longitude) * (Math.PI / 180) * 6371000 *
              Math.cos(last.latitude * Math.PI / 180);
            const dist = Math.sqrt(dx * dx + dy * dy);
            setCurrentDistance(prev => prev + dist);
          }

          lastLocationRef.current = location;

          // Update duration and pace
          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setCurrentDuration(elapsed);
            const pace = calculatePace(currentDistance, elapsed);
            setCurrentPace(pace);
          }

          console.log('[WorkoutContext] Location update:', newPoint.latitude.toFixed(6), newPoint.longitude.toFixed(6), 'total pts:', routeRef.current.length);
        }
      }
    });

    return () => {
      TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME).then((registered) => {
        if (registered) {
          console.log('[WorkoutContext] Unregistering background task');
          TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
        }
      });
    };
  }, [currentDistance]);

  // ─── Load saved workouts ────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[WorkoutContext] Loading saved workouts...');
    AsyncStorage.getItem(WORKOUTS_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log('[WorkoutContext] Loaded', parsed.length, 'workouts');
          setWorkouts(parsed);
        } catch (err) {
          console.error('[WorkoutContext] Error parsing workouts:', err);
        }
      } else {
        console.log('[WorkoutContext] No saved workouts found');
      }
    });
  }, []);

  // ─── Start workout ─────────────────────────────────────────────────────────
  const startWorkout = useCallback(async () => {
    console.log('[WorkoutContext] startWorkout — resetting state and starting...');
    routeRef.current = [];
    lastLocationRef.current = null;
    startTimeRef.current = Date.now();
    setCurrentRoute([]);
    setCurrentDistance(0);
    setCurrentDuration(0);
    setCurrentPace(0);
    setIsTracking(true);
    setActiveWorkout({
      startedAt: new Date().toISOString(),
      route: [],
      distance: 0,
      duration: 0,
      isActive: true,
    });

    console.log('[WorkoutContext] startWorkout — starting background tracking...');
    await startBackgroundTracking();
    setIsBackgroundTracking(true);
    console.log('[WorkoutContext] startWorkout — complete, tracking active');
  }, []);

  // ─── Stop workout ──────────────────────────────────────────────────────────
  const stopWorkout = useCallback(async (isRunning: boolean): Promise<Workout | null> => {
    console.log('[WorkoutContext] stopWorkout — stopping and saving...');
    if (!startTimeRef.current) {
      console.log('[WorkoutContext] stopWorkout — no start time, returning null');
      return null;
    }

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    console.log('[WorkoutContext] stopWorkout — duration:', duration, 'seconds');

    await stopBackgroundTracking();
    setIsBackgroundTracking(false);

    const route = [...routeRef.current];
    const distance = currentDistance;
    const pace = calculatePace(distance, duration);
    const speed = calculateSpeed(distance, duration);
    const calories = estimateCalories(distance, duration, isRunning);

    const workout: Workout = {
      id: uuidv4(),
      date: new Date().toISOString(),
      duration,
      distance,
      route,
      avgPace: pace,
      avgSpeed: speed,
      calories,
      isRunning,
    };

    console.log('[WorkoutContext] stopWorkout — workout created, id:', workout.id, 'route pts:', route.length);

    const updated = [workout, ...workouts];
    setWorkouts(updated);
    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(updated));
    console.log('[WorkoutContext] stopWorkout — saved', updated.length, 'total workouts');

    setIsTracking(false);
    setActiveWorkout(null);
    routeRef.current = [];
    lastLocationRef.current = null;
    startTimeRef.current = null;

    return workout;
  }, [workouts, currentDistance]);

  // ─── Delete workout ────────────────────────────────────────────────────────
  const deleteWorkout = useCallback(async (id: string) => {
    console.log('[WorkoutContext] deleteWorkout — id:', id);
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(updated));
    console.log('[WorkoutContext] deleteWorkout — done,', updated.length, 'remaining');
  }, [workouts]);

  // ─── Get by id ─────────────────────────────────────────────────────────────
  const getWorkoutById = useCallback((id: string): Workout | undefined => {
    return workouts.find(w => w.id === id);
  }, [workouts]);

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        activeWorkout,
        isTracking,
        currentRoute,
        currentDistance,
        currentDuration,
        currentPace,
        startWorkout,
        stopWorkout,
        deleteWorkout,
        getWorkoutById,
        isBackgroundTracking,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}

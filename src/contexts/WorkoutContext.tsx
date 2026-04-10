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
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<LatLng[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const routeRef = useRef<LatLng[]>([]);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);

  // Register the background task
  useEffect(() => {
    TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
      if (error) {
        console.error('Background location error:', error);
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

          // Calculate distance
          if (lastLocationRef.current) {
            const dx = newPoint.latitude - lastLocationRef.current.coords.latitude;
            const dy = newPoint.longitude - lastLocationRef.current.coords.longitude;
            const dLat = dx * (Math.PI / 180) * 6371000;
            const dLon = dy * (Math.PI / 180) * 6371000 * Math.cos(lastLocationRef.current.coords.latitude * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLon * dLon);
            setCurrentDistance(prev => prev + dist);
          }

          lastLocationRef.current = location;

          // Update duration
          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setCurrentDuration(elapsed);
            const pace = calculatePace(currentDistance + dist, elapsed);
            setCurrentPace(pace);
          }
        }
      }
    });

    return () => {
      TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME).then((registered) => {
        if (registered) TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
      });
    };
  }, []);

  // Load saved workouts
  useEffect(() => {
    AsyncStorage.getItem(WORKOUTS_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setWorkouts(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const startWorkout = useCallback(async () => {
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

    // Start background tracking
    await startBackgroundTracking();
    setIsBackgroundTracking(true);
  }, []);

  const stopWorkout = useCallback(async (isRunning: boolean): Promise<Workout | null> => {
    if (!startTimeRef.current) return null;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Stop background tracking
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

    // Save to state and storage
    const updated = [workout, ...workouts];
    setWorkouts(updated);
    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(updated));

    // Reset
    setIsTracking(false);
    setActiveWorkout(null);
    routeRef.current = [];
    lastLocationRef.current = null;
    startTimeRef.current = null;

    return workout;
  }, [workouts, currentDistance]);

  const deleteWorkout = useCallback(async (id: string) => {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(updated));
  }, [workouts]);

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

// Workout data model
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Workout {
  id: string;
  date: string; // ISO string
  duration: number; // seconds
  distance: number; // meters
  route: LatLng[];
  avgPace: number; // seconds per kilometer
  avgSpeed: number; // meters per second
  calories: number;
  isRunning: boolean;
}

export type WorkoutActivity = 'running' | 'walking';

export type LocationPermissionStatus =
  | 'undetermined'
  | 'denied'
  | 'limited'
  | 'granted';

export interface ActiveWorkout {
  startedAt: string;
  route: LatLng[];
  distance: number;
  duration: number;
  isActive: boolean;
}

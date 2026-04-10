import * as Location from 'expo-location';

export const LOCATION_TASK_NAME = 'workout-tracking';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

/**
 * Check what location permissions are currently granted
 */
export async function getLocationPermissionStatus(): Promise<Location.LocationPermissionResponse> {
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();

  return {
    status: fg.status,
    scope: bg.status === 'granted' ? 'whenInUse' : fg.scope,
  };
}

/**
 * Request foreground location permission
 */
export async function requestForegroundPermission(): Promise<Location.LocationPermissionResponse> {
  return Location.requestForegroundPermissionsAsync();
}

/**
 * Request background location permission
 * Must be called AFTER foreground permission is granted
 */
export async function requestBackgroundPermission(): Promise<Location.LocationPermissionResponse> {
  return Location.requestBackgroundPermissionsAsync();
}

/**
 * Request ALL location permissions (foreground + background) in one shot
 * Use this when user taps "Start Tracking" for the first time
 */
export async function requestAllLocationPermissions(): Promise<{
  foreground: Location.LocationPermissionResponse;
  background: Location.LocationPermissionResponse;
}> {
  const foreground = await Location.requestForegroundPermissionsAsync();

  let background = { status: 'denied' as const };

  // Only request background if foreground was granted
  if (foreground.status === 'granted') {
    background = await Location.requestBackgroundPermissionsAsync();
  }

  return { foreground, background };
}

/**
 * Check if we have sufficient permission to track
 * Returns true if foreground is granted (background is optional but recommended)
 */
export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Start location tracking as a background task
 * This continues even when the app is in the background / screen is off
 */
export async function startBackgroundTracking(): Promise<void> {
  // Define the background task
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'FitTrack',
      notificationBody: 'Tracking your workout...',
      notificationColor: '#00D4AA',
    },
    pausesUpdatesAutomatically: false,
    distanceInterval: 5, // meters
    timeInterval: 1000, // ms — 1 second for live pace updates
  });
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundTracking(): Promise<void> {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

/**
 * Check if background tracking is currently running
 */
export async function isBackgroundTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
}

/**
 * Get current location once (for initial position on map)
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    return Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    return null;
  }
}

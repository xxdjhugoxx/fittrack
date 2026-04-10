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
 * Check current location permission status (foreground + background)
 */
export async function getLocationPermissionStatus(): Promise<Location.LocationPermissionResponse> {
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();
  console.log('[LocationService] getLocationPermissionStatus — FG:', fg.status, 'BG:', bg.status);
  return {
    status: fg.status,
    scope: bg.status === 'granted' ? 'whenInUse' : fg.scope,
  };
}

/**
 * Request foreground location permission
 */
export async function requestForegroundPermission(): Promise<Location.LocationPermissionResponse> {
  console.log('[LocationService] requestForegroundPermission — requesting...');
  const result = await Location.requestForegroundPermissionsAsync();
  console.log('[LocationService] requestForegroundPermission — result:', result.status);
  return result;
}

/**
 * Request background location permission
 * Must be called AFTER foreground permission is granted
 */
export async function requestBackgroundPermission(): Promise<Location.LocationPermissionResponse> {
  console.log('[LocationService] requestBackgroundPermission — requesting...');
  const result = await Location.requestBackgroundPermissionsAsync();
  console.log('[LocationService] requestBackgroundPermission — result:', result.status);
  return result;
}

/**
 * Request ALL location permissions (foreground + background) in one shot
 * Called when user taps "Start Tracking" for the first time
 */
export async function requestAllLocationPermissions(): Promise<{
  foreground: Location.LocationPermissionResponse;
  background: Location.LocationPermissionResponse;
}> {
  console.log('[LocationService] requestAllLocationPermissions — starting...');
  const foreground = await Location.requestForegroundPermissionsAsync();
  console.log('[LocationService] Foreground status:', foreground.status);

  let background = { status: 'denied' as const };

  // Only request background if foreground was granted
  if (foreground.status === 'granted') {
    background = await Location.requestBackgroundPermissionsAsync();
    console.log('[LocationService] Background status:', background.status);
  } else {
    console.log('[LocationService] Foreground not granted, skipping background request');
  }

  return { foreground, background };
}

/**
 * Check if we have sufficient permission to track
 * Returns true if foreground is granted (background is optional but recommended)
 */
export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  console.log('[LocationService] hasLocationPermission:', status === 'granted');
  return status === 'granted';
}

/**
 * Start location tracking as a background task
 * This continues even when the app is in the background / screen is off
 */
export async function startBackgroundTracking(): Promise<void> {
  console.log('[LocationService] startBackgroundTracking — starting location updates...');
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
    timeInterval: 1000,  // ms — 1 second for live pace updates
  });
  console.log('[LocationService] startBackgroundTracking — started successfully');
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundTracking(): Promise<void> {
  console.log('[LocationService] stopBackgroundTracking — stopping...');
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  console.log('[LocationService] isTracking:', isTracking);
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[LocationService] stopBackgroundTracking — stopped');
  } else {
    console.log('[LocationService] stopBackgroundTracking — was not tracking');
  }
}

/**
 * Check if background tracking is currently running
 */
export async function isBackgroundTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
}

/**
 * Get current location once (for initial position)
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[LocationService] getCurrentLocation — no permission');
      return null;
    }
    console.log('[LocationService] getCurrentLocation — fetching...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    console.log('[LocationService] getCurrentLocation — got location');
    return location;
  } catch (err) {
    console.error('[LocationService] getCurrentLocation — error:', err);
    return null;
  }
}

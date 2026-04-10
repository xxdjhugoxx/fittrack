// Formatters for workout data

/**
 * Format seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format pace from seconds/km to MM:SS /km
 */
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format meters to miles with 2 decimal places
 */
export function formatDistanceMeters(meters: number): string {
  const miles = meters / 1609.344;
  return miles.toFixed(2);
}

/**
 * Format meters to km with 2 decimal places
 */
export function formatDistanceKm(meters: number): string {
  const km = meters / 1000;
  return km.toFixed(2);
}

/**
 * Format m/s to mph
 */
export function formatSpeedMps(mps: number): string {
  const mph = mps * 2.237;
  return mph.toFixed(1);
}

/**
 * Format date to readable string
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date + time
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Estimate calories burned (rough estimate)
 */
export function estimateCalories(
  distanceMeters: number,
  durationSeconds: number,
  isRunning: boolean
): number {
  // Very rough estimate: running ~60 cal/km, walking ~35 cal/km
  const km = distanceMeters / 1000;
  const rate = isRunning ? 60 : 35;
  return Math.round(km * rate);
}

/**
 * Calculate pace (seconds per km) from distance and duration
 */
export function calculatePace(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters <= 0) return 0;
  const km = distanceMeters / 1000;
  return durationSeconds / km;
}

/**
 * Calculate speed in m/s
 */
export function calculateSpeed(distanceMeters: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return distanceMeters / durationSeconds;
}

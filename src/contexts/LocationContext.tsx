import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import * as Location from 'expo-location';
import {
  requestAllLocationPermissions,
  requestBackgroundPermission,
  getLocationPermissionStatus,
} from '../services/locationService';

type PermissionStatus = 'undetermined' | 'denied' | 'limited' | 'granted';

interface LocationContextValue {
  permissionStatus: PermissionStatus;
  backgroundPermission: PermissionStatus;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshPermissionStatus: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [backgroundPermission, setBackgroundPermission] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissionStatus = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();

    setPermissionStatus(status as PermissionStatus);
    setBackgroundPermission(bg.status as PermissionStatus);
  }, []);

  useEffect(() => {
    refreshPermissionStatus().finally(() => setIsLoading(false));
  }, [refreshPermissionStatus]);

  /**
   * Request both foreground AND background location permissions
   * Called when user taps "Start Tracking" for the first time
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { foreground, background } = await requestAllLocationPermissions();

      setPermissionStatus(foreground.status as PermissionStatus);
      setBackgroundPermission(background.status as PermissionStatus);

      return foreground.status === 'granted';
    } catch (err) {
      console.error('Location permission error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        permissionStatus,
        backgroundPermission,
        isLoading,
        requestPermission,
        refreshPermissionStatus,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}

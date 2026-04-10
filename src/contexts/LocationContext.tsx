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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshPermissionStatus = useCallback(async () => {
    console.log('[LocationContext] Refreshing permission status...');
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();
      console.log('[LocationContext] Foreground:', status, 'Background:', bg.status);
      setPermissionStatus(status as PermissionStatus);
      setBackgroundPermission(bg.status as PermissionStatus);
    } catch (err) {
      console.error('[LocationContext] Error getting permission status:', err);
    }
  }, []);

  useEffect(() => {
    console.log('[LocationContext] Initializing...');
    refreshPermissionStatus()
      .finally(() => {
        console.log('[LocationContext] Initialization complete');
        setIsLoading(false);
      });
  }, [refreshPermissionStatus]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('[LocationContext] requestPermission called');
    setIsLoading(true);
    try {
      const { foreground, background } = await requestAllLocationPermissions();
      console.log('[LocationContext] Foreground granted:', foreground.status);
      console.log('[LocationContext] Background granted:', background.status);

      setPermissionStatus(foreground.status as PermissionStatus);
      setBackgroundPermission(background.status as PermissionStatus);

      const granted = foreground.status === 'granted';
      console.log('[LocationContext] Overall granted:', granted);
      return granted;
    } catch (err) {
      console.error('[LocationContext] Permission request error:', err);
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

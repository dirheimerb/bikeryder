import * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';

import { LOCATION_TASK } from './locationTask';
import { useTrackingStore } from './store';

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 5,
  timeInterval: 1000,
};

export interface PermissionResult {
  foreground: boolean;
  background: boolean;
}

/**
 * Owns the GPS subscription lifecycle for a recording. Uses exactly one source
 * of location updates at a time so distance is never double-counted:
 *   - `background` mode via a TaskManager task + Android foreground service
 *   - `foreground` mode via watchPositionAsync (fallback / Expo Go)
 */
export function useRecorder() {
  const start = useTrackingStore((s) => s.start);
  const pause = useTrackingStore((s) => s.pause);
  const resume = useTrackingStore((s) => s.resume);
  const stop = useTrackingStore((s) => s.stop);
  const addPoint = useTrackingStore((s) => s.addPoint);

  const mode = useRef<'background' | 'foreground' | null>(null);
  const watchSub = useRef<Location.LocationSubscription | null>(null);

  const requestPermissions = useCallback(async (): Promise<PermissionResult> => {
    const fg = await Location.requestForegroundPermissionsAsync();
    let background = false;
    if (fg.granted) {
      try {
        const bg = await Location.requestBackgroundPermissionsAsync();
        background = bg.granted;
      } catch {
        background = false;
      }
    }
    return { foreground: fg.granted, background };
  }, []);

  const stopUpdates = useCallback(async () => {
    if (mode.current === 'foreground') {
      watchSub.current?.remove();
      watchSub.current = null;
    } else if (mode.current === 'background') {
      try {
        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
        if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      } catch {
        // ignore
      }
    }
    mode.current = null;
  }, []);

  const startUpdates = useCallback(
    async (canBackground: boolean) => {
      if (mode.current) return; // already running

      if (canBackground) {
        try {
          await Location.startLocationUpdatesAsync(LOCATION_TASK, {
            ...WATCH_OPTIONS,
            pausesUpdatesAutomatically: false,
            activityType: Location.ActivityType.Fitness,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'bikeryder is recording',
              notificationBody: 'Your ride is being tracked.',
              notificationColor: '#FF5A1F',
            },
          });
          mode.current = 'background';
          return;
        } catch {
          // Fall through to foreground watching.
        }
      }

      watchSub.current = await Location.watchPositionAsync(WATCH_OPTIONS, (loc) => {
        addPoint({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          elevation: loc.coords.altitude ?? null,
          speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
          timestamp: loc.timestamp,
        });
      });
      mode.current = 'foreground';
    },
    [addPoint],
  );

  const startRide = useCallback(async (): Promise<PermissionResult> => {
    const perms = await requestPermissions();
    if (!perms.foreground) return perms;
    start();
    await startUpdates(perms.background);
    return perms;
  }, [requestPermissions, start, startUpdates]);

  const finishRide = useCallback(async () => {
    stop();
    await stopUpdates();
  }, [stop, stopUpdates]);

  // Safety net: tear down any active subscription if the component unmounts.
  useEffect(() => {
    return () => {
      stopUpdates();
    };
  }, [stopUpdates]);

  return { startRide, pause, resume, finishRide };
}

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { useTrackingStore } from './store';

/**
 * Background location task. Defined at module scope (required by TaskManager).
 * It is the single source of GPS samples when background updates are running;
 * the foreground `watchPositionAsync` fallback is only used when this task
 * cannot start (e.g. no background permission / Expo Go).
 */
export const LOCATION_TASK = 'bikeryder-location-updates';

type LocationTaskData = { locations: Location.LocationObject[] };

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data as LocationTaskData;
  if (!locations?.length) return;

  const add = useTrackingStore.getState().addPoint;
  for (const loc of locations) {
    add({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      elevation: loc.coords.altitude ?? null,
      speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
      timestamp: loc.timestamp,
    });
  }
});

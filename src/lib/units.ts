import type { UnitPreference } from '@/types/database';

const KM_PER_MILE = 1.609344;
const M_PER_FOOT = 0.3048;

/** Format a distance given in metres for display. */
export function formatDistance(meters: number, units: UnitPreference): string {
  if (units === 'imperial') {
    const miles = meters / 1000 / KM_PER_MILE;
    return `${miles.toFixed(miles < 10 ? 2 : 1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

/** Format a speed given in metres/second for display. */
export function formatSpeed(metersPerSecond: number, units: UnitPreference): string {
  if (units === 'imperial') {
    const mph = (metersPerSecond * 3600) / 1000 / KM_PER_MILE;
    return `${mph.toFixed(1)} mph`;
  }
  const kmh = (metersPerSecond * 3600) / 1000;
  return `${kmh.toFixed(1)} km/h`;
}

/** Format an elevation given in metres for display. */
export function formatElevation(meters: number, units: UnitPreference): string {
  if (units === 'imperial') {
    return `${Math.round(meters / M_PER_FOOT)} ft`;
  }
  return `${Math.round(meters)} m`;
}

/** Format a duration given in seconds as H:MM:SS or M:SS. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export const unitLabels = {
  metric: { distance: 'km', speed: 'km/h', elevation: 'm' },
  imperial: { distance: 'mi', speed: 'mph', elevation: 'ft' },
} as const;

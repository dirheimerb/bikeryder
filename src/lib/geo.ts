import polyline from '@mapbox/polyline';

export interface TrackPoint {
  lat: number;
  lng: number;
  elevation?: number | null;
  speed?: number | null;
  /** epoch millis */
  timestamp: number;
}

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance between two coordinates, in metres. */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface RideStats {
  distanceM: number;
  elapsedS: number;
  movingS: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  elevationGainM: number;
}

// Ignore GPS jitter below this speed when accumulating moving time (m/s).
const MOVING_SPEED_THRESHOLD = 0.5;
// Smooth out elevation noise: only count gains above this step (m).
const ELEVATION_NOISE_M = 1.5;

/** Derive summary statistics from an ordered list of track points. */
export function computeStats(points: TrackPoint[]): RideStats {
  if (points.length < 2) {
    return {
      distanceM: 0,
      elapsedS: 0,
      movingS: 0,
      avgSpeedMps: 0,
      maxSpeedMps: 0,
      elevationGainM: 0,
    };
  }

  let distanceM = 0;
  let movingS = 0;
  let maxSpeedMps = 0;
  let elevationGainM = 0;
  let lastCountedElevation = points[0].elevation ?? null;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    const segDist = haversine(prev, cur);
    const dt = (cur.timestamp - prev.timestamp) / 1000;

    distanceM += segDist;

    if (dt > 0) {
      const segSpeed = cur.speed ?? segDist / dt;
      if (segSpeed >= MOVING_SPEED_THRESHOLD) {
        movingS += dt;
      }
      if (segSpeed > maxSpeedMps) {
        maxSpeedMps = segSpeed;
      }
    }

    if (cur.elevation != null && lastCountedElevation != null) {
      const climb = cur.elevation - lastCountedElevation;
      if (climb >= ELEVATION_NOISE_M) {
        elevationGainM += climb;
        lastCountedElevation = cur.elevation;
      } else if (climb <= -ELEVATION_NOISE_M) {
        lastCountedElevation = cur.elevation;
      }
    } else if (cur.elevation != null && lastCountedElevation == null) {
      lastCountedElevation = cur.elevation;
    }
  }

  const elapsedS = (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
  const avgSpeedMps = movingS > 0 ? distanceM / movingS : 0;

  return { distanceM, elapsedS, movingS, avgSpeedMps, maxSpeedMps, elevationGainM };
}

/** Encode track points to a precision-5 polyline string. */
export function encodeTrack(points: { lat: number; lng: number }[]): string {
  return polyline.encode(points.map((p) => [p.lat, p.lng]));
}

/** Decode a precision-5 polyline string into coordinates. */
export function decodeTrack(encoded: string): { latitude: number; longitude: number }[] {
  return polyline.decode(encoded).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
}

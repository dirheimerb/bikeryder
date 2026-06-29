import { create } from 'zustand';

import { haversine, type TrackPoint } from '@/lib/geo';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'finished';

// Below this speed (m/s) we treat the rider as stopped and don't accrue moving time.
const MOVING_SPEED_THRESHOLD = 0.5;
const ELEVATION_NOISE_M = 1.5;
// Reject obviously bad fixes that would teleport the track.
const MAX_PLAUSIBLE_SPEED_MPS = 35; // ~126 km/h

interface TrackingState {
  status: RecordingStatus;
  points: TrackPoint[];
  startedAtMs: number | null;

  // Live, incrementally-maintained stats.
  distanceM: number;
  movingS: number;
  maxSpeedMps: number;
  elevationGainM: number;

  // Internal accumulators for elapsed-time accounting across pauses.
  accumulatedMs: number;
  segmentStartMs: number | null;
  lastCountedElevation: number | null;
  skipNextSegment: boolean;

  start: () => void;
  addPoint: (p: TrackPoint) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  elapsedMs: () => number;
}

const initial = {
  status: 'idle' as RecordingStatus,
  points: [] as TrackPoint[],
  startedAtMs: null as number | null,
  distanceM: 0,
  movingS: 0,
  maxSpeedMps: 0,
  elevationGainM: 0,
  accumulatedMs: 0,
  segmentStartMs: null as number | null,
  lastCountedElevation: null as number | null,
  skipNextSegment: false,
};

export const useTrackingStore = create<TrackingState>((set, get) => ({
  ...initial,

  start: () => {
    const now = Date.now();
    set({ ...initial, status: 'recording', startedAtMs: now, segmentStartMs: now });
  },

  addPoint: (p) => {
    const s = get();
    if (s.status !== 'recording') return;

    const points = s.points;
    const prev = points[points.length - 1];

    let { distanceM, movingS, maxSpeedMps, elevationGainM, lastCountedElevation } = s;

    if (prev && !s.skipNextSegment) {
      const segDist = haversine(prev, p);
      const dt = (p.timestamp - prev.timestamp) / 1000;
      if (dt > 0) {
        const segSpeed = p.speed ?? segDist / dt;
        // Drop implausible jumps (tunnels, cold GPS) so they don't corrupt totals.
        if (segSpeed <= MAX_PLAUSIBLE_SPEED_MPS) {
          distanceM += segDist;
          if (segSpeed >= MOVING_SPEED_THRESHOLD) movingS += dt;
          if (segSpeed > maxSpeedMps) maxSpeedMps = segSpeed;
        }
      }
    }

    if (p.elevation != null) {
      if (lastCountedElevation == null) {
        lastCountedElevation = p.elevation;
      } else {
        const climb = p.elevation - lastCountedElevation;
        if (climb >= ELEVATION_NOISE_M) {
          elevationGainM += climb;
          lastCountedElevation = p.elevation;
        } else if (climb <= -ELEVATION_NOISE_M) {
          lastCountedElevation = p.elevation;
        }
      }
    }

    set({
      points: [...points, p],
      distanceM,
      movingS,
      maxSpeedMps,
      elevationGainM,
      lastCountedElevation,
      skipNextSegment: false,
    });
  },

  pause: () => {
    const s = get();
    if (s.status !== 'recording') return;
    const now = Date.now();
    set({
      status: 'paused',
      accumulatedMs: s.accumulatedMs + (s.segmentStartMs ? now - s.segmentStartMs : 0),
      segmentStartMs: null,
      // Don't count the distance covered while paused into the next segment.
      skipNextSegment: true,
    });
  },

  resume: () => {
    const s = get();
    if (s.status !== 'paused') return;
    set({ status: 'recording', segmentStartMs: Date.now() });
  },

  stop: () => {
    const s = get();
    if (s.status === 'idle' || s.status === 'finished') return;
    const now = Date.now();
    set({
      status: 'finished',
      accumulatedMs: s.accumulatedMs + (s.segmentStartMs ? now - s.segmentStartMs : 0),
      segmentStartMs: null,
    });
  },

  reset: () => set({ ...initial }),

  elapsedMs: () => {
    const s = get();
    const live = s.segmentStartMs ? Date.now() - s.segmentStartMs : 0;
    return s.accumulatedMs + live;
  },
}));

import { encodeTrack, type TrackPoint } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { Ride, RidePoint } from '@/types/database';

export interface SaveRideInput {
  userId: string;
  title: string | null;
  notes: string | null;
  startedAtMs: number;
  endedAtMs: number;
  distanceM: number;
  movingS: number;
  elapsedS: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  elevationGainM: number;
  points: TrackPoint[];
}

// Persist points in batches to stay well under payload limits on long rides.
const POINT_BATCH = 500;

/**
 * Insert a ride and its track points. If point insertion fails the ride row is
 * rolled back (deleted) so we never leave a ride without its track.
 */
export async function saveRide(input: SaveRideInput): Promise<Ride> {
  const polyline = input.points.length ? encodeTrack(input.points) : null;

  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      user_id: input.userId,
      title: input.title,
      notes: input.notes,
      started_at: new Date(input.startedAtMs).toISOString(),
      ended_at: new Date(input.endedAtMs).toISOString(),
      distance_m: input.distanceM,
      moving_time_s: Math.round(input.movingS),
      elapsed_time_s: Math.round(input.elapsedS),
      avg_speed_mps: input.avgSpeedMps,
      max_speed_mps: input.maxSpeedMps,
      elevation_gain_m: input.elevationGainM,
      polyline,
    })
    .select('*')
    .single();
  if (error) throw error;

  if (input.points.length) {
    const rows = input.points.map((p, i) => ({
      ride_id: ride.id,
      seq: i,
      lat: p.lat,
      lng: p.lng,
      elevation_m: p.elevation ?? null,
      speed_mps: p.speed ?? null,
      recorded_at: new Date(p.timestamp).toISOString(),
    }));

    for (let i = 0; i < rows.length; i += POINT_BATCH) {
      const { error: ptErr } = await supabase
        .from('ride_points')
        .insert(rows.slice(i, i + POINT_BATCH));
      if (ptErr) {
        await supabase.from('rides').delete().eq('id', ride.id);
        throw ptErr;
      }
    }
  }

  return ride;
}

export async function listRides(userId: string): Promise<Ride[]> {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRide(rideId: string): Promise<Ride | null> {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRidePoints(rideId: string): Promise<RidePoint[]> {
  const { data, error } = await supabase
    .from('ride_points')
    .select('*')
    .eq('ride_id', rideId)
    .order('seq', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deleteRide(rideId: string): Promise<void> {
  const { error } = await supabase.from('rides').delete().eq('id', rideId);
  if (error) throw error;
}

export async function updateRide(
  rideId: string,
  patch: Partial<Pick<Ride, 'title' | 'notes' | 'visibility'>>,
): Promise<Ride> {
  const { data, error } = await supabase
    .from('rides')
    .update(patch)
    .eq('id', rideId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

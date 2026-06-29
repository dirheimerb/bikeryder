/**
 * Hand-authored database types mirroring `supabase/migrations`.
 *
 * Once a real project is provisioned you can regenerate these with:
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UnitPreference = 'metric' | 'imperial';
export type Visibility = 'private' | 'public';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  unit_preference: UnitPreference;
  created_at: string;
  updated_at: string;
}

export type Ride = {
  id: string;
  user_id: string;
  title: string | null;
  notes: string | null;
  sport: string;
  visibility: Visibility;
  started_at: string;
  ended_at: string | null;
  distance_m: number;
  moving_time_s: number;
  elapsed_time_s: number;
  avg_speed_mps: number;
  max_speed_mps: number;
  elevation_gain_m: number;
  /** Encoded polyline (precision 5) for quick map rendering. */
  polyline: string | null;
  created_at: string;
  updated_at: string;
}

export type RidePoint = {
  id: number;
  ride_id: string;
  seq: number;
  lat: number;
  lng: number;
  elevation_m: number | null;
  speed_mps: number | null;
  recorded_at: string;
}

type Row<T> = T;
type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type Update<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>;
        Insert: Insert<Profile, 'created_at' | 'updated_at' | 'unit_preference'>;
        Update: Update<Profile>;
        Relationships: [];
      };
      rides: {
        Row: Row<Ride>;
        Insert: Insert<
          Ride,
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'title'
          | 'notes'
          | 'sport'
          | 'visibility'
          | 'ended_at'
          | 'distance_m'
          | 'moving_time_s'
          | 'elapsed_time_s'
          | 'avg_speed_mps'
          | 'max_speed_mps'
          | 'elevation_gain_m'
          | 'polyline'
        >;
        Update: Update<Ride>;
        Relationships: [];
      };
      ride_points: {
        Row: Row<RidePoint>;
        Insert: Insert<RidePoint, 'id' | 'elevation_m' | 'speed_mps'>;
        Update: Update<RidePoint>;
        Relationships: [
          {
            foreignKeyName: 'ride_points_ride_id_fkey';
            columns: ['ride_id'];
            referencedRelation: 'rides';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      unit_preference: UnitPreference;
      visibility: Visibility;
    };
    CompositeTypes: Record<string, never>;
  };
}

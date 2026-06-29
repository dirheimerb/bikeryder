import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/AuthProvider';
import {
  deleteRide,
  getRide,
  getRidePoints,
  listRides,
  saveRide,
  updateRide,
  type SaveRideInput,
} from './api';

export function useRides() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['rides', userId],
    queryFn: () => listRides(userId as string),
    enabled: Boolean(userId),
  });
}

export function useRide(rideId: string) {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId),
  });
}

export function useRidePoints(rideId: string) {
  return useQuery({
    queryKey: ['ride-points', rideId],
    queryFn: () => getRidePoints(rideId),
    enabled: Boolean(rideId),
  });
}

export function useSaveRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveRideInput) => saveRide(input),
    onSuccess: (ride) => {
      qc.invalidateQueries({ queryKey: ['rides', ride.user_id] });
    },
  });
}

export function useDeleteRide() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rideId: string) => deleteRide(rideId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rides', session?.user.id] });
    },
  });
}

export function useUpdateRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rideId,
      patch,
    }: {
      rideId: string;
      patch: Parameters<typeof updateRide>[1];
    }) => updateRide(rideId, patch),
    onSuccess: (ride) => {
      qc.setQueryData(['ride', ride.id], ride);
      qc.invalidateQueries({ queryKey: ['rides', ride.user_id] });
    },
  });
}

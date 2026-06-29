import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { StatTile } from '@/components/StatTile';
import { useUnits } from '@/features/profile/useProfile';
import { useDeleteRide, useRide } from '@/features/rides/hooks';
import { decodeTrack } from '@/lib/geo';
import { formatDistance, formatDuration, formatElevation, formatSpeed } from '@/lib/units';
import { colors, font, spacing } from '@/theme';

export default function RideDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const units = useUnits();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ride, isLoading } = useRide(id);
  const deleteRide = useDeleteRide();

  const polylineStr = ride?.polyline ?? null;
  const coordinates = useMemo(
    () => (polylineStr ? decodeTrack(polylineStr) : []),
    [polylineStr],
  );

  function onDelete() {
    Alert.alert('Delete ride?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRide.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Ride not found.</Text>
      </View>
    );
  }

  const avg = ride.moving_time_s > 0 ? ride.distance_m / ride.moving_time_s : 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: ride.title || 'Ride',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerRight: () => (
            <Pressable onPress={onDelete} hitSlop={12}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
      >
        {coordinates.length > 1 ? (
          <RouteMap coordinates={coordinates} style={styles.map} interactive />
        ) : null}

        <View style={styles.body}>
          <Text style={styles.date}>
            {format(new Date(ride.started_at), 'EEEE, MMM d yyyy · h:mm a')}
          </Text>

          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <StatTile label="Distance" value={formatDistance(ride.distance_m, units)} emphasis />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Moving time" value={formatDuration(ride.moving_time_s)} />
              <StatTile label="Avg speed" value={formatSpeed(avg, units)} />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Max speed" value={formatSpeed(ride.max_speed_mps, units)} />
              <StatTile
                label="Elevation"
                value={formatElevation(ride.elevation_gain_m, units)}
              />
            </View>
          </Card>

          {ride.notes ? (
            <Card>
              <Text style={styles.notes}>{ride.notes}</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { color: colors.textMuted },
  map: {
    height: 280,
  },
  body: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  date: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
  statsCard: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
  },
  notes: {
    color: colors.text,
    fontSize: font.size.md,
    lineHeight: 22,
  },
});

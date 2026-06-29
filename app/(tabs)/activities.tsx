import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnits } from '@/features/profile/useProfile';
import { useRides } from '@/features/rides/hooks';
import { formatDistance, formatDuration, formatSpeed } from '@/lib/units';
import type { Ride } from '@/types/database';
import { colors, font, radius, spacing } from '@/theme';

function RideRow({ ride }: { ride: Ride }) {
  const units = useUnits();
  const avg = ride.moving_time_s > 0 ? ride.distance_m / ride.moving_time_s : 0;
  return (
    <Link href={`/ride/${ride.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name="bicycle" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {ride.title || 'Untitled ride'}
          </Text>
          <Text style={styles.rowDate}>
            {format(new Date(ride.started_at), 'EEE, MMM d · h:mm a')}
          </Text>
          <View style={styles.rowStats}>
            <Text style={styles.stat}>{formatDistance(ride.distance_m, units)}</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{formatDuration(ride.moving_time_s)}</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{formatSpeed(avg, units)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </Link>
  );
}

export default function Activities() {
  const insets = useSafeAreaInsets();
  const { data: rides, isLoading, isError, error, refetch, isRefetching } = useRides();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.heading}>Activities</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Couldn’t load rides{error instanceof Error ? `: ${error.message}` : ''}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RideRow ride={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
            gap: spacing.sm,
          }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bicycle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No rides yet.</Text>
              <Text style={styles.emptySub}>Head to Record to track your first ride.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heading: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: colors.text,
    fontSize: font.size.md,
    fontWeight: '700',
  },
  rowDate: {
    color: colors.textMuted,
    fontSize: font.size.xs,
    marginTop: 2,
  },
  rowStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stat: {
    color: colors.text,
    fontSize: font.size.sm,
    fontWeight: '600',
  },
  statDot: {
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    color: colors.text,
    fontSize: font.size.md,
    fontWeight: '600',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
});

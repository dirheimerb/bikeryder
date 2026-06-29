import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card } from '@/components/ui';
import { StatTile } from '@/components/StatTile';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { useRides } from '@/features/rides/hooks';
import { formatDistance, formatDuration, formatElevation } from '@/lib/units';
import { useAuth } from '@/providers/AuthProvider';
import type { UnitPreference } from '@/types/database';
import { colors, font, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: rides } = useRides();

  const units: UnitPreference = profile?.unit_preference ?? 'metric';

  const totals = useMemo(() => {
    const list = rides ?? [];
    return {
      count: list.length,
      distanceM: list.reduce((sum, r) => sum + r.distance_m, 0),
      movingS: list.reduce((sum, r) => sum + r.moving_time_s, 0),
      elevationM: list.reduce((sum, r) => sum + r.elevation_gain_m, 0),
    };
  }, [rides]);

  const displayName = profile?.display_name || session?.user.email || 'Rider';

  function setUnits(next: UnitPreference) {
    if (next !== units) updateProfile.mutate({ unit_preference: next });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.lg,
      }}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.sectionLabel}>Lifetime</Text>
        <View style={styles.statRow}>
          <StatTile label="Rides" value={String(totals.count)} />
          <StatTile label="Distance" value={formatDistance(totals.distanceM, units)} />
        </View>
        <View style={styles.statRow}>
          <StatTile label="Time" value={formatDuration(totals.movingS)} />
          <StatTile label="Elevation" value={formatElevation(totals.elevationM, units)} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Units</Text>
        <View style={styles.toggle}>
          {(['metric', 'imperial'] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => setUnits(u)}
              style={[styles.toggleOption, units === u && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, units === u && styles.toggleTextActive]}>
                {u === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: font.size.lg,
    fontWeight: '800',
  },
  email: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: font.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: font.size.sm,
  },
  toggleTextActive: {
    color: colors.text,
  },
});

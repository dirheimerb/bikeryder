import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Field, ScreenTitle } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { StatTile } from '@/components/StatTile';
import { useUnits } from '@/features/profile/useProfile';
import { useSaveRide } from '@/features/rides/hooks';
import { useTrackingStore } from '@/features/tracking/store';
import { formatDistance, formatDuration, formatElevation, formatSpeed } from '@/lib/units';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';

export default function SaveRide() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const units = useUnits();
  const { session } = useAuth();
  const saveRide = useSaveRide();

  const store = useTrackingStore();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const coordinates = useMemo(
    () => store.points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    [store.points],
  );

  const elapsedS = store.accumulatedMs / 1000;
  const avgSpeedMps = store.movingS > 0 ? store.distanceM / store.movingS : 0;

  async function onSave() {
    if (!session) return;
    const startedAtMs = store.startedAtMs ?? Date.now();
    try {
      const ride = await saveRide.mutateAsync({
        userId: session.user.id,
        title: title.trim() || null,
        notes: notes.trim() || null,
        startedAtMs,
        endedAtMs: startedAtMs + store.accumulatedMs,
        distanceM: store.distanceM,
        movingS: store.movingS,
        elapsedS,
        avgSpeedMps,
        maxSpeedMps: store.maxSpeedMps,
        elevationGainM: store.elevationGainM,
        points: store.points,
      });
      store.reset();
      router.replace(`/ride/${ride.id}`);
    } catch (e) {
      Alert.alert('Could not save ride', e instanceof Error ? e.message : 'Unknown error');
    }
  }

  function onDiscard() {
    Alert.alert('Discard ride?', 'This recording will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          store.reset();
          router.replace('/(tabs)');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <ScreenTitle>Save your ride</ScreenTitle>

      {coordinates.length > 1 ? (
        <RouteMap coordinates={coordinates} style={styles.map} />
      ) : (
        <Card style={styles.noRoute}>
          <Text style={styles.noRouteText}>No GPS track was recorded for this ride.</Text>
        </Card>
      )}

      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <StatTile label="Distance" value={formatDistance(store.distanceM, units)} />
          <StatTile label="Moving" value={formatDuration(store.movingS)} />
        </View>
        <View style={styles.statRow}>
          <StatTile label="Avg" value={formatSpeed(avgSpeedMps, units)} />
          <StatTile label="Elev gain" value={formatElevation(store.elevationGainM, units)} />
        </View>
      </Card>

      <Field
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Morning ride"
      />
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="How did it go?"
        multiline
        style={styles.notes}
      />

      <Button label="Save ride" onPress={onSave} loading={saveRide.isPending} />
      <Button label="Discard" variant="secondary" onPress={onDiscard} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  map: {
    height: 220,
    borderRadius: 16,
  },
  noRoute: {
    alignItems: 'center',
  },
  noRouteText: {
    color: colors.textMuted,
  },
  statsCard: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
  },
  notes: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
});

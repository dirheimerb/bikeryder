import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatTile } from '@/components/StatTile';
import { useUnits } from '@/features/profile/useProfile';
import { useTrackingStore } from '@/features/tracking/store';
import { useRecorder } from '@/features/tracking/useRecorder';
import { formatDistance, formatDuration, formatElevation, formatSpeed } from '@/lib/units';
import { colors, font, radius, spacing } from '@/theme';

export default function Record() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const units = useUnits();
  const { startRide, pause, resume, finishRide } = useRecorder();

  const status = useTrackingStore((s) => s.status);
  const points = useTrackingStore((s) => s.points);
  const distanceM = useTrackingStore((s) => s.distanceM);
  const maxSpeedMps = useTrackingStore((s) => s.maxSpeedMps);
  const elevationGainM = useTrackingStore((s) => s.elevationGainM);
  const movingS = useTrackingStore((s) => s.movingS);
  const getElapsedMs = useTrackingStore((s) => s.elapsedMs);

  const mapRef = useRef<MapView>(null);
  // A 1s heartbeat re-renders the elapsed clock while recording; the value
  // itself is derived from the store so we never setState inside an effect.
  const [, setTick] = useState(0);

  // When a recording finishes, jump to the save/review screen.
  useEffect(() => {
    if (status === 'finished') {
      router.push('/ride/save');
    }
  }, [status, router]);

  // Tick once a second while recording.
  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsedMs = status === 'idle' || status === 'finished' ? 0 : getElapsedMs();

  const coordinates = useMemo(
    () => points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    [points],
  );

  // Keep the camera centred on the latest fix.
  const last = points[points.length - 1];
  useEffect(() => {
    if (last && (status === 'recording' || status === 'paused')) {
      mapRef.current?.animateCamera({ center: { latitude: last.lat, longitude: last.lng } }, {
        duration: 500,
      });
    }
  }, [last, status]);

  const avgSpeedMps = movingS > 0 ? distanceM / movingS : 0;
  const isActive = status === 'recording' || status === 'paused';

  async function onStart() {
    const perms = await startRide();
    if (!perms.foreground) {
      Alert.alert(
        'Location needed',
        'bikeryder needs location access to record your ride. Enable it in Settings.',
      );
    }
  }

  function onStopConfirm() {
    Alert.alert('Finish ride?', 'Stop recording and review your ride.', [
      { text: 'Keep riding', style: 'cancel' },
      { text: 'Finish', style: 'destructive', onPress: () => finishRide() },
    ]);
  }

  const initialRegion: Region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={!isActive}
      >
        {coordinates.length > 1 ? (
          <Polyline coordinates={coordinates} strokeColor={colors.primary} strokeWidth={5} />
        ) : null}
      </MapView>

      {/* Live stats panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.primaryRow}>
          <StatTile
            label={`Distance`}
            value={formatDistance(distanceM, units)}
            emphasis
          />
        </View>
        <View style={styles.row}>
          <StatTile label="Duration" value={formatDuration(elapsedMs / 1000)} />
          <StatTile label="Avg speed" value={formatSpeed(avgSpeedMps, units)} />
        </View>
        <View style={styles.row}>
          <StatTile label="Max speed" value={formatSpeed(maxSpeedMps, units)} />
          <StatTile label="Elevation" value={formatElevation(elevationGainM, units)} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isActive ? (
            <Pressable style={[styles.bigButton, styles.start]} onPress={onStart}>
              <Ionicons name="play" size={32} color={colors.text} />
              <Text style={styles.bigButtonLabel}>Start</Text>
            </Pressable>
          ) : (
            <>
              {status === 'recording' ? (
                <Pressable style={[styles.bigButton, styles.pause]} onPress={pause}>
                  <Ionicons name="pause" size={28} color={colors.text} />
                  <Text style={styles.bigButtonLabel}>Pause</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.bigButton, styles.start]} onPress={resume}>
                  <Ionicons name="play" size={28} color={colors.text} />
                  <Text style={styles.bigButtonLabel}>Resume</Text>
                </Pressable>
              )}
              <Pressable style={[styles.bigButton, styles.stop]} onPress={onStopConfirm}>
                <Ionicons name="stop" size={28} color={colors.text} />
                <Text style={styles.bigButtonLabel}>Finish</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {status === 'paused' ? (
        <View style={[styles.pausedBadge, { top: insets.top + spacing.md }]}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  primaryRow: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  bigButton: {
    flex: 1,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bigButtonLabel: {
    color: colors.text,
    fontSize: font.size.lg,
    fontWeight: '800',
  },
  start: { backgroundColor: colors.primary },
  pause: { backgroundColor: colors.surfaceAlt },
  stop: { backgroundColor: colors.danger },
  pausedBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pausedText: {
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: font.size.sm,
  },
});

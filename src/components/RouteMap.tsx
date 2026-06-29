import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { LatLng, Polyline, Marker, Region } from 'react-native-maps';

import { colors } from '@/theme';

function regionForCoords(coords: LatLng[]): Region | undefined {
  if (!coords.length) return undefined;
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;
  for (const c of coords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  const latPad = Math.max((maxLat - minLat) * 0.3, 0.003);
  const lngPad = Math.max((maxLng - minLng) * 0.3, 0.003);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + latPad,
    longitudeDelta: maxLng - minLng + lngPad,
  };
}

/**
 * Renders a static route trace fitted to the given coordinates. Used on ride
 * detail. For the live recording map see the Record screen.
 */
export function RouteMap({
  coordinates,
  style,
  interactive = false,
}: {
  coordinates: LatLng[];
  style?: ViewStyle;
  interactive?: boolean;
}) {
  const region = useMemo(() => regionForCoords(coordinates), [coordinates]);
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {coordinates.length > 1 ? (
          <Polyline coordinates={coordinates} strokeColor={colors.primary} strokeWidth={4} />
        ) : null}
        {start ? <Marker coordinate={start} pinColor={colors.success} /> : null}
        {end && coordinates.length > 1 ? (
          <Marker coordinate={end} pinColor={colors.danger} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
});

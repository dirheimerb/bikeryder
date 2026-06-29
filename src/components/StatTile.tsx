import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, font, spacing } from '@/theme';

export function StatTile({
  label,
  value,
  emphasis,
  style,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.tile, style]}>
      <Text style={[styles.value, emphasis && styles.valueEmphasis]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  valueEmphasis: {
    fontSize: font.size.stat,
    color: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
});

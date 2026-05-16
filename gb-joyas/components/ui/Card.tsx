// components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean; // fondo blush para cards destacados
  padding?: number;
}

export function Card({ children, style, accent = false, padding = 14 }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        accent && styles.accent,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accent: {
    backgroundColor: COLORS.blush,
    borderColor: COLORS.peach,
  },
});

// components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style || {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.surface : COLORS.wine}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variantes
  primary: {
    backgroundColor: COLORS.wine,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Tamaños
  size_sm: { paddingVertical: 8, paddingHorizontal: 13 },
  size_md: { paddingVertical: 11, paddingHorizontal: 16 },
  size_lg: { paddingVertical: 14, paddingHorizontal: 20 },

  // Texto
  text: { fontWeight: '600' },
  text_primary: { color: COLORS.surface },
  text_secondary: { color: COLORS.textPrimary },
  text_ghost: { color: COLORS.textPrimary },

  textSize_sm: { fontSize: 12 },
  textSize_md: { fontSize: 13 },
  textSize_lg: { fontSize: 15 },
});

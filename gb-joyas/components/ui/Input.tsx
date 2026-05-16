// components/ui/Input.tsx
import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  style?: TextStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : {},
          style,
        ]}
        placeholderTextColor={COLORS.textLight}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: {
    fontSize: SIZES.textXs,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: SIZES.textMd,
    color: COLORS.textPrimary,
    minHeight: 44,
  },
  inputFocused: { borderColor: COLORS.peach },
  inputError: { borderColor: COLORS.wine },
  error: {
    fontSize: SIZES.textXs,
    color: COLORS.wine,
    marginTop: 4,
  },
});

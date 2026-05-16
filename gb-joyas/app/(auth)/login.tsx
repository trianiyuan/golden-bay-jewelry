// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SIZES } from '../../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Required fields', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login error', 'Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Vertical.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtitle}>Inventory Management</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="your@email.com"
          />
          <Input
            label="Password" value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••"
          />
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, justifyContent: 'center', padding: SIZES.xxl },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoImg: { width: 140, height: 140, marginBottom: 12 },
  logoSubtitle: { fontSize: 14, color: COLORS.textMuted },
  form: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusXl,
    padding: SIZES.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  loginBtn: {
    backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '600' },
});
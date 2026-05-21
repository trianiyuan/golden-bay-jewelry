// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresá tu correo y contraseña.');
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error al iniciar sesión', 'Verificá tu correo y contraseña.');
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
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Vertical.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtitle}>Gestión de inventario</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="tucorreo@email.com"
          />
          <View style={styles.passwordContainer}>
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPassword}
              placeholder="••••••••"
              containerStyle={{ marginBottom: 0 }}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setMostrarPassword(prev => !prev)}
              activeOpacity={0.7}
            >
              {mostrarPassword ? (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx={12} cy={12} r={3} />
                </Svg>
              ) : (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <Path d="M1 1l22 22" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Entrando...' : 'Ingresar'}</Text>
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
  passwordContainer: { position: 'relative', marginBottom: 8 },
  eyeBtn: { position: 'absolute', right: 12, bottom: 12 },
  loginBtn: {
    backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '600' },
});
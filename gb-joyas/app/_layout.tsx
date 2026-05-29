import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// ── Fuentes Boutique ──────────────────────────────────────────
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';

SplashScreen.preventAutoHideAsync();

function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  if (!isWide) return <>{children}</>;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const { session, setSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);

  // ── Carga de fuentes ────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    'CormorantGaramond-Regular':  CormorantGaramond_400Regular,
    'CormorantGaramond-Medium':   CormorantGaramond_500Medium,
    'CormorantGaramond-SemiBold': CormorantGaramond_600SemiBold,
    'CormorantGaramond-Italic':   CormorantGaramond_400Regular_Italic,
    'HankenGrotesk-Regular':      HankenGrotesk_400Regular,
    'HankenGrotesk-Medium':       HankenGrotesk_500Medium,
    'HankenGrotesk-SemiBold':     HankenGrotesk_600SemiBold,
    'HankenGrotesk-Bold':         HankenGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, initialized]);

  // Espera fuentes antes de renderizar
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" backgroundColor="#E8D2B9" />
      <MaxWidthWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="product/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sale/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </MaxWidthWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#C4A882' , // --sand
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1200,
    flex: 1,
    backgroundColor: '#FFFCFA', // --cream
  },
});
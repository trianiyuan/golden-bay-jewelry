// components/ui/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../constants/colors';

interface HeaderProps {
  showBack?: boolean;
  backLabel?: string;
  title?: string;
  rightElement?: React.ReactNode;
}

export function Header({ showBack, backLabel = '‹ Back', title, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Left — GB monogram or back button */}
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{backLabel}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.logoCircle}>
          <Image source={require('../../assets/Vertical.png')} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
      )}

      {/* Center — Golden Bay Jewelry wordmark or custom title */}
      <View style={styles.centerContainer}>
        {title ? (
          <Text style={styles.pageTitle}>{title}</Text>
        ) : (
          <Image source={require('../../assets/Horizontal.png')} style={styles.wordmarkImg} resizeMode="contain" />
        )}
      </View>

      {/* Right — optional element */}
      <View style={styles.right}>
        {rightElement || <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // GB monogram circle
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blush,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMono: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.wine,
    letterSpacing: 0.5,
  },
  // Back button
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 40,
  },
  backText: {
    fontSize: 14,
    color: COLORS.wine,
    fontWeight: '500',
  },
  // Center
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  wordmark: {
    alignItems: 'center',
  },
  wordmarkMain: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.wine,
    letterSpacing: 0.3,
  },
  wordmarkSub: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 2.5,
    marginTop: -2,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  logoImg: {
  width: 28,
  height: 28,
},
wordmarkImg: {
  height: 28,
  width: 160,
},
});

interface PageHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, rightElement }: PageHeaderProps) {
  const router = useRouter();
  return (
    <>
      <GlobalHeader />
      <View style={pageStyles.bar}>
        <View style={{ flex: 1 }} />
        <Text style={pageStyles.title}>{title}</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {rightElement}
        </View>
      </View>
    </>
  );
}

function GlobalHeader() {
  const { setSession } = require('../../stores/authStore').useAuthStore();
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);

  async function handleConfirm() {
    setShowModal(false);
    const { supabase } = require('../../lib/supabase');
    await supabase.auth.signOut();
    setSession(null);
    router.replace('/(auth)/login' as any);
  }

  return (
    <>
      <View style={pageStyles.globalHeader}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.logoCircle}>
          <Image source={require('../../assets/Vertical.png')} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.centerContainer}>
          <Image source={require('../../assets/Horizontal.png')} style={styles.wordmarkImg} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={{ fontSize: 13, color: COLORS.wine, fontWeight: '500' }}>Config</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={{ fontSize: 13, color: COLORS.wine, fontWeight: '500' }}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={showModal} transparent animationType="fade">
        <View style={pageStyles.overlay}>
          <View style={pageStyles.card}>
            <View style={pageStyles.iconCircle}><Text style={pageStyles.iconText}>GB</Text></View>
            <Text style={pageStyles.cardTitle}>¿Cerrar sesión?</Text>
            <Text style={pageStyles.cardSub}>Podés volver a entrar cuando quieras.</Text>
            <TouchableOpacity style={pageStyles.btnPrimary} onPress={handleConfirm}>
              <Text style={pageStyles.btnPrimaryText}>Sí, salir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pageStyles.btnSecondary} onPress={() => setShowModal(false)}>
              <Text style={pageStyles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const pageStyles = StyleSheet.create({
  globalHeader: {
    backgroundColor: COLORS.surface, paddingHorizontal: SIZES.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  overlay: { flex: 1, backgroundColor: 'rgba(26,10,10,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#FFF1ED', borderRadius: 20, padding: 28, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 1, borderColor: '#E8C8B8' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E8C8B8' },
  iconText: { fontSize: 16, fontWeight: '700', color: '#622632', letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1A0A0A', marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: '#8F5C52', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  btnPrimary: { width: '100%', backgroundColor: '#622632', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { color: '#FFF1ED', fontSize: 14, fontWeight: '600' },
  btnSecondary: { width: '100%', backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#E8C8B8' },
  btnSecondaryText: { color: '#622632', fontSize: 14, fontWeight: '500' },
});
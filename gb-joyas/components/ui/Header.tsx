// components/ui/Header.tsx — Boutique theme
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radius } from '../../constants/theme';

// ─── Header principal (Dashboard) ────────────────────────────
interface HeaderProps {
  showBack?: boolean;
  backLabel?: string;
  title?: string;
  rightElement?: React.ReactNode;
}

export function Header({ showBack, backLabel = '‹ Volver', title, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Izquierda — monograma o botón volver */}
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{backLabel}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.monogram}>
          <Image source={require('../../assets/Vertical.png')} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
      )}

      {/* Centro — wordmark o título */}
      <View style={styles.center}>
        {title ? (
          <Text style={styles.centerTitle}>{title}</Text>
        ) : (
          <Image source={require('../../assets/Horizontal.png')} style={styles.wordmarkImg} resizeMode="contain" />
        )}
      </View>

      {/* Derecha */}
      <View style={styles.right}>
        {rightElement || <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

// ─── PageHeader (todas las tabs excepto index) ────────────────
interface PageHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, rightElement }: PageHeaderProps) {
  return (
    <>
      <GlobalHeader />
      <View style={styles.pageBar}>
        <View style={{ flex: 1 }} />
        <Text style={styles.pageTitle}>{title}</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {rightElement}
        </View>
      </View>
    </>
  );
}

// ─── GlobalHeader (logo + wordmark + config/salir) ────────────
export function GlobalHeader() {
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
      <View style={styles.header}>
        {/* Monograma */}
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.monogram}>
          <Image source={require('../../assets/Vertical.png')} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Wordmark */}
        <View style={styles.center}>
          <Image source={require('../../assets/Horizontal.png')} style={styles.wordmarkImg} resizeMode="contain" />
        </View>

        {/* Links */}
        <View style={styles.headerLinks}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
            <Text style={[styles.headerLink, { color: colors.wine }]}>Config</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerBtn}>
            <Text style={[styles.headerLink, { color: colors.wine }]}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal cerrar sesión */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={modal.overlay}>
          <View style={modal.card}>
            <View style={modal.monogram}>
              <Text style={modal.monogramText}>GB</Text>
            </View>
            <Text style={modal.title}>¿Cerrar sesión?</Text>
            <Text style={modal.subtitle}>Podés volver a entrar cuando quieras.</Text>
            <TouchableOpacity style={modal.btnPrimary} onPress={handleConfirm}>
              <Text style={modal.btnPrimaryText}>Sí, salir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.btnSecondary} onPress={() => setShowModal(false)}>
              <Text style={modal.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header compartido
  header: {
    backgroundColor: colors.cream,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Monograma GB
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 28,
    height: 28,
  },

  // Wordmark imagen
  center: {
    flex: 1,
    alignItems: 'center',
  },
  wordmarkImg: {
    height: 28,
    width: 160,
  },

  // Título centrado (para Header con title)
  centerTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
  },

  // Botón volver
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 40,
  },
  backText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.wine,
  },

  // Links derecha (Config / Salir)
  headerLinks: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  headerLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerBtn: {
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.line,
},

  // Derecha genérica
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },

  // PageBar (título de pantalla + acción)
  pageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.sand,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pageTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    color: colors.wine,
    flex: 1,
    textAlign: 'center',
  },
});

// ─── Modal styles ─────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,10,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  monogram: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  monogramText: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 18,
    color: colors.wine,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 14,
  },
  btnSecondary: {
    width: '100%',
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  btnSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.wine,
    fontSize: 14,
  },
});

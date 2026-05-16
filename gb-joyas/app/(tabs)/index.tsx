// app/(tabs)/index.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS, SIZES } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { getProductos, getProductosStockBajo } from '../../lib/queries/products';
import { getVentas } from '../../lib/queries/sales';
import { getResumenMes } from '../../lib/queries/finances';
import { Venta, Producto, ResumenMes } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

function SignOutModal({ visible, onCancel, onConfirm }: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.card}>
          <View style={modal.iconCircle}>
            <Text style={modal.iconText}>GB</Text>
          </View>
          <Text style={modal.title}>¿Cerrar sesión?</Text>
          <Text style={modal.subtitle}>Podés volver a entrar cuando quieras.</Text>
          <TouchableOpacity style={modal.btnPrimary} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={modal.btnPrimaryText}>Sí, salir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modal.btnSecondary} onPress={onCancel} activeOpacity={0.85}>
            <Text style={modal.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SignOutButton() {
  const { setSession } = useAuthStore();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm() {
    setShowModal(false);
    await supabase.auth.signOut();
    setSession(null);
    router.replace('/(auth)/login' as any);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Salir</Text>
      </TouchableOpacity>
      <SignOutModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7}>
      <Text style={{ fontSize: 13, color: COLORS.wine, fontWeight: '500' }}>Config</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [totalProductos, setTotalProductos] = useState(0);
  const [stockBajo, setStockBajo] = useState<Producto[]>([]);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [loading, setLoading] = useState(true);
  const hoy = new Date();

  const cargar = useCallback(() => {
    async function fetchData() {
      try {
        const [v, sb, r, p] = await Promise.all([
          getVentas(hoy),
          getProductosStockBajo(3),
          getResumenMes(hoy.getFullYear(), hoy.getMonth()),
          getProductos(),
        ]);
        setVentas(v);
        setStockBajo(sb);
        setResumen(r);
        setTotalProductos(p.length);
      } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useFocusEffect(cargar);
  const ultimasVentas = ventas.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <Header rightElement={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SettingsButton/>
          <SignOutButton />
        </View>
      } />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PRODUCTOS</Text>
            <Text style={styles.metricValue}>{loading ? '—' : totalProductos}</Text>
            <Text style={styles.metricSub}>en inventario</Text>
          </View>
          <View style={[styles.metricCard, styles.metricAccent]}>
            <Text style={styles.metricLabel}>VENTAS DEL MES</Text>
            <Text style={styles.metricValue}>{loading ? '—' : ventas.length}</Text>
            <Text style={styles.metricSub}>₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricArena]}>
            <Text style={[styles.metricLabel, { color: '#7A4A20' }]}>GANANCIA</Text>
            <Text style={styles.metricValue}>₡{Math.round((resumen?.ganancia || 0) / 1000)}k</Text>
            <Text style={[styles.metricSub, { color: '#7A4A20' }]}>este mes</Text>
          </View>
          <TouchableOpacity style={[styles.metricCard, styles.metricWarn]}
            onPress={() => router.push('/(tabs)/inventory?filter=stock_bajo')} activeOpacity={0.85}>
            <Text style={[styles.metricLabel, { color: 'rgba(255,255,255,0.8)' }]}>STOCK BAJO</Text>
            <Text style={[styles.metricValue, { color: 'white' }]}>{loading ? '—' : stockBajo.length}</Text>
            <Text style={[styles.metricSub, { color: 'rgba(255,255,255,0.9)', fontWeight: '600' }]}>
              {stockBajo.length > 0 ? 'ver productos ›' : 'todo en orden ✓'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>VENTAS RECIENTES</Text>
        {ultimasVentas.map(venta => (
          <View key={venta.id} style={styles.ventaItem}>
            <View style={styles.ventaAvatar}>
              <Text style={styles.ventaAvatarText}>{venta.cliente_nombre.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.ventaInfo}>
              <Text style={styles.ventaNombre}>{venta.cliente_nombre}</Text>
              <Text style={styles.ventaDetalle} numberOfLines={1}>
                {venta.metodo_entrega === 'correos_cr' ? 'Correos CR' : 'Retiro personal'}
                {(venta as any).canal_venta?.nombre ? ` · ${(venta as any).canal_venta.nombre}` : ''}
              </Text>
            </View>
            <Text style={styles.ventaMonto}>₡{Math.round(Number(venta.total_cobrado) / 1000)}k</Text>
          </View>
        ))}
        {ultimasVentas.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sin ventas este mes todavía</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fabPrimary} onPress={() => router.push('/sale/new')} activeOpacity={0.85}>
          <Text style={styles.fabPrimaryText}>+ Registrar venta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => router.push('/(tabs)/inventory')} activeOpacity={0.85}>
          <Text style={styles.fabSecondaryText}>Ver inventario</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,10,10,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#FFF1ED', borderRadius: 20, padding: 28, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 1, borderColor: '#E8C8B8' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E8C8B8' },
  iconText: { fontSize: 16, fontWeight: '700', color: '#622632', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A0A0A', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#8F5C52', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  btnPrimary: { width: '100%', backgroundColor: '#622632', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { color: '#FFF1ED', fontSize: 14, fontWeight: '600' },
  btnSecondary: { width: '100%', backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#E8C8B8' },
  btnSecondaryText: { color: '#622632', fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SIZES.lg },
  metricCard: { width: '47.5%', backgroundColor: '#FFF1ED', borderRadius: SIZES.radiusLg, padding: 14, borderWidth: 1, borderColor: '#F5D5CB' },
  metricAccent: { backgroundColor: '#ECABA0', borderColor: '#E09080' },
  metricArena: { backgroundColor: '#EDD3B9', borderColor: '#DFC09A' },
  metricWarn: { backgroundColor: '#8F4450', borderColor: '#7A3540' },
  metricLabel: { fontSize: SIZES.textXs, color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 6 },
  metricValue: { fontSize: SIZES.textH2, fontWeight: '600', color: COLORS.textPrimary },
  metricSub: { fontSize: SIZES.textSm, color: COLORS.textMuted, marginTop: 3 },
  sectionTitle: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 10, marginTop: SIZES.lg },
  ventaItem: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ventaAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.blush, alignItems: 'center', justifyContent: 'center' },
  ventaAvatarText: { fontSize: 12, fontWeight: '600', color: COLORS.wine },
  ventaInfo: { flex: 1 },
  ventaNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  ventaDetalle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  ventaMonto: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  fabRow: { flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: SIZES.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  fabPrimary: { flex: 1, backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  fabPrimaryText: { color: COLORS.surface, fontSize: 13, fontWeight: '600' },
  fabSecondary: { flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  fabSecondaryText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  signOutBtn: { paddingVertical: 4, paddingLeft: 8 },
  signOutText: { fontSize: 13, color: COLORS.wine, fontWeight: '500' },
  settingsBtn: { paddingVertical: 4, paddingRight: 8 },
  settingsText: { fontSize: 18 },
});
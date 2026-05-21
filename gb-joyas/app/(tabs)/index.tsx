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
      <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7} style={styles.headerBtn}>
        <Text style={styles.headerBtnText}>Salir</Text>
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
    <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7} style={styles.headerBtn}>
      <Text style={styles.headerBtnText}>Config</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SettingsButton />
          <SignOutButton />
        </View>
      } />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {hoy.getMonth() === 4 && (
        <TouchableOpacity
          style={styles.yearEndBanner}
          onPress={() => router.push('/(tabs)/finances')}
          activeOpacity={0.85}
        >
          <Text style={styles.yearEndIcon}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.yearEndTitle}>Año {hoy.getFullYear()} terminando</Text>
            <Text style={styles.yearEndSub}>Descargá tu reporte anual antes de que se archive en enero.</Text>
          </View>
          <Text style={styles.yearEndArrow}>›</Text>
        </TouchableOpacity>
      )}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricDefault]}>
            <Text style={styles.metricLabel}>PRODUCTOS</Text>
            <Text style={styles.metricValue}>{loading ? '—' : totalProductos}</Text>
            <Text style={styles.metricSub}>en inventario</Text>
          </View>
          <View style={[styles.metricCard, styles.metricAccent]}>
            <Text style={[styles.metricLabel, { color: '#7A3030' }]}>VENTAS DEL MES</Text>
            <Text style={[styles.metricValue, { color: '#3D1010' }]}>{loading ? '—' : ventas.length}</Text>
            <Text style={[styles.metricSub, { color: '#7A3030' }]}>₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricArena]}>
            <Text style={[styles.metricLabel, { color: '#7A4A20' }]}>GANANCIA</Text>
            <Text style={[styles.metricValue, { color: '#3D2010' }]}>₡{Math.round((resumen?.ganancia || 0) / 1000)}k</Text>
            <Text style={[styles.metricSub, { color: '#7A4A20' }]}>este mes</Text>
          </View>
          <TouchableOpacity style={[styles.metricCard, styles.metricWarn]}
            onPress={() => router.push('/(tabs)/inventory?filter=stock_bajo')} activeOpacity={0.85}>
            <Text style={[styles.metricLabel, { color: 'rgba(255,241,237,0.7)' }]}>STOCK BAJO</Text>
            <Text style={[styles.metricValue, { color: 'white' }]}>{loading ? '—' : stockBajo.length}</Text>
            <Text style={[styles.metricSub, { color: 'rgba(255,241,237,0.9)', fontWeight: '600' }]}>
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
              </Text>
              {venta.canal_venta?.nombre && (
                <View style={styles.canalBadge}>
                  <Text style={styles.canalBadgeText}>{venta.canal_venta?.nombre}</Text>
                </View>
              )}
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
  card: { backgroundColor: '#FFF1ED', borderRadius: 24, padding: 28, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 1, borderColor: '#E8C8B8', shadowColor: '#622632', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E8C8B8' },
  iconText: { fontSize: 16, fontWeight: '700', color: '#622632', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A0A0A', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#8F5C52', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  btnPrimary: { width: '100%', backgroundColor: '#622632', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10, shadowColor: '#622632', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
  btnPrimaryText: { color: '#FFF1ED', fontSize: 14, fontWeight: '600' },
  btnSecondary: { width: '100%', backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8C8B8' },
  btnSecondaryText: { color: '#622632', fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg, paddingBottom: SIZES.xxl },

  headerBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(98,38,50,0.15)', backgroundColor: 'transparent' },
  headerBtnText: { fontSize: 12, color: COLORS.wine, fontWeight: '500' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SIZES.lg },
  metricCard: { width: '47.5%', borderRadius: 16, padding: 16 },
  metricDefault: { backgroundColor: '#FFF8F5', borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  metricAccent: { backgroundColor: '#ECABA0', borderWidth: 1, borderColor: '#E09080', shadowColor: '#ECABA0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16 },
  metricArena: { backgroundColor: '#EDD3B9', borderWidth: 1, borderColor: '#DFC09A', shadowColor: '#EDD3B9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16 },
  metricWarn: { backgroundColor: '#622632', borderWidth: 1, borderColor: '#7A3540', shadowColor: '#622632', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 20 },

  metricLabel: { fontSize: 9, color: '#8F5C52', letterSpacing: 0.9, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 30, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  metricSub: { fontSize: SIZES.textSm, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },

  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#8F5C52', letterSpacing: 1, marginBottom: 10, marginTop: SIZES.lg, textTransform: 'uppercase' },

  ventaItem: { backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  ventaAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center' },
  ventaAvatarText: { fontSize: 12, fontWeight: '700', color: '#622632' },
  ventaInfo: { flex: 1 },
  ventaNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  ventaDetalle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  canalBadge: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(98,38,50,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  canalBadgeText: { fontSize: 10, color: '#622632', fontWeight: '600' },
  ventaMonto: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },

  fabRow: { flexDirection: 'row', gap: 10, padding: 14, paddingHorizontal: SIZES.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: 'rgba(232,200,184,0.6)' },
  fabPrimary: { flex: 1, backgroundColor: COLORS.wine, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#622632', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
  fabPrimaryText: { color: COLORS.surface, fontSize: 13, fontWeight: '600' },
  fabSecondary: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(98,38,50,0.2)' },
  fabSecondaryText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  yearEndBanner: { backgroundColor: '#FFF0EE', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#622632', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  yearEndIcon: { fontSize: 24 },
  yearEndTitle: { fontSize: 13, fontWeight: '600', color: '#622632', marginBottom: 2 },
  yearEndSub: { fontSize: 11, color: '#8F5C52', lineHeight: 16 },
  yearEndArrow: { fontSize: 20, color: '#622632', fontWeight: '600' },
});
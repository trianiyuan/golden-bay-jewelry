// app/(tabs)/index.tsx — Boutique theme
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, typography, shared, spacing, radius } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { getProductos, getProductosStockBajo } from '../../lib/queries/products';
import { getVentas } from '../../lib/queries/sales';
import { getResumenMes } from '../../lib/queries/finances';
import { Venta, Producto, ResumenMes } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

// ─── Modal cerrar sesión ──────────────────────────────────────
function SignOutModal({ visible, onCancel, onConfirm }: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.card}>
          <View style={modal.monogram}>
            <Text style={modal.monogramText}>GB</Text>
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

// ─── Botón salir ──────────────────────────────────────────────
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

// ─── Botón configuración ──────────────────────────────────────
function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7} style={styles.headerBtn}>
      <Text style={styles.headerBtnText}>Config</Text>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [totalProductos, setTotalProductos] = useState(0);
  const [stockBajo, setStockBajo] = useState<Producto[]>([]);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcPrecio, setCalcPrecio] = useState('');
  const [calcPct, setCalcPct] = useState('30');
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

  const precio = parseFloat(calcPrecio) || 0;
  const pct = parseFloat(calcPct) || 0;
  const inflado = pct > 0 && pct < 100 ? Math.round(precio / (1 - pct / 100)) : 0;
  const desinflado = pct > 0 ? Math.round(precio * (1 - pct / 100)) : 0;

  const ingresos = resumen?.ingresos_ventas || 0;
  const ganancia = resumen?.ganancia || 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Header rightElement={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SettingsButton />
          <SignOutButton />
        </View>
      } />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Banner fin de año */}
        {hoy.getMonth() === 11 && (
          <TouchableOpacity
            style={styles.yearEndBanner}
            onPress={() => router.push('/(tabs)/finances')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.yearEndTitle}>Año {hoy.getFullYear()} terminando</Text>
              <Text style={styles.yearEndSub}>Descargá tu reporte anual antes de que se archive en enero.</Text>
            </View>
            <Text style={styles.yearEndArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Hero panel vino ── */}
        <LinearGradient
          colors={['#6A2233', '#5A1B2B', '#3F1320']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* marco dorado */}
          <View style={styles.heroFrame} pointerEvents="none" />

          <Text style={styles.heroEyebrow}>
            {hoy.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' }).toUpperCase()} · INGRESOS DEL MES
          </Text>
          <Text style={styles.heroAmount}>
            ₡{loading ? '—' : ingresos.toLocaleString('es-CR')}
          </Text>
          <Text style={styles.heroSub}>
            <Text style={{ color: colors.goldSoft, fontFamily: fonts.sansSemiBold }}>
              {ventas.length} ventas
            </Text>
            {ganancia > 0 && (
              <Text> · margen del {ingresos > 0 ? Math.round((ganancia / ingresos) * 100) : 0} % este mes</Text>
            )}
          </Text>
        </LinearGradient>

        {/* ── Métricas 3 tiles ── */}
        <View style={styles.metricsRow}>
          {/* Productos */}
          <View style={[styles.metricCard]}>
            <View style={styles.metricAccentBar} />
            <Text style={styles.metricLabel}>PRODUCTOS</Text>
            <Text style={styles.metricValue}>{loading ? '—' : totalProductos}</Text>
            <Text style={styles.metricSub}>en inventario</Text>
          </View>

          {/* Ventas del mes */}
          <View style={styles.metricCard}>
            <View style={styles.metricAccentBar} />
            <Text style={styles.metricLabel}>VENTAS DEL MES</Text>
            <Text style={[styles.metricValue, { color: colors.wine }]}>
              {loading ? '—' : ventas.length}
            </Text>
            <Text style={styles.metricSub}>
              ₡{ingresos.toLocaleString('es-CR')}
            </Text>
          </View>

          {/* Stock bajo */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => router.push('/(tabs)/inventory?filter=stock_bajo')}
            activeOpacity={0.85}
          >
            <View style={styles.metricAccentBar} />
            <Text style={styles.metricLabel}>STOCK BAJO</Text>
            <Text style={styles.metricValue}>{loading ? '—' : stockBajo.length}</Text>
            <Text style={[styles.metricSub, stockBajo.length > 0 && { color: colors.wine, fontFamily: fonts.sansSemiBold }]}>
              {stockBajo.length > 0 ? 'ver productos ›' : 'todo en orden'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Calculadora de precios ── */}
        <View style={[styles.block, { marginTop: 1 }]}>
          <Text style={[typography.label, { marginBottom: 12 }]}>Calculadora de precios</Text>
          <Text style={styles.calcDesc}>
            Sabé a cuánto poner tus productos en un canal con comisión, y cuánto te queda.
          </Text>

          <View style={styles.calcRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.calcLabel}>PRECIO BASE (₡)</Text>
              <TextInput
                style={styles.calcInput}
                value={calcPrecio}
                onChangeText={v => setCalcPrecio(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="10 000"
                placeholderTextColor={colors.muted2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.calcLabel}>COMISIÓN (%)</Text>
              <TextInput
                style={styles.calcInput}
                value={calcPct}
                onChangeText={v => setCalcPct(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.muted2}
              />
            </View>
          </View>

          {precio > 0 && pct > 0 ? (
            <>
              <View style={styles.calcResultRow}>
                <View style={styles.calcResult}>
                  <Text style={styles.calcResultLabel}>Precio a cobrar</Text>
                  <Text style={styles.calcResultValue}>₡{inflado.toLocaleString('es-CR')}</Text>
                  <Text style={styles.calcResultHint}>Ponelo así en el canal para recibir tu precio base completo</Text>
                </View>
                <View style={styles.calcDivider} />
                <View style={styles.calcResult}>
                  <Text style={styles.calcResultLabel}>Lo que recibís</Text>
                  <Text style={styles.calcResultValue}>₡{desinflado.toLocaleString('es-CR')}</Text>
                  <Text style={styles.calcResultHint}>Si el canal ya tiene el precio inflado y te quita el {pct}%</Text>
                </View>
              </View>
              <View style={styles.calcExample}>
                <Text style={styles.calcExampleText}>
                  Tu producto cuesta ₡{precio.toLocaleString('es-CR')} → lo ponés a ₡{inflado.toLocaleString('es-CR')} → el canal quita {pct}% (₡{(inflado - precio).toLocaleString('es-CR')}) → vos recibís ₡{precio.toLocaleString('es-CR')}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.calcHint}>
              Ingresá el precio base y el porcentaje de comisión para calcular
            </Text>
          )}
        </View>

        {/* ── Ventas recientes ── */}
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={typography.label}>Ventas recientes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/sales')} activeOpacity={0.7}>
              <Text style={styles.blockMore}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {ultimasVentas.length === 0 && !loading ? (
            <Text style={styles.emptyText}>Sin ventas este mes todavía</Text>
          ) : (
            ultimasVentas.map((venta, i) => (
              <View key={venta.id} style={[styles.saleRow, i === ultimasVentas.length - 1 && { borderBottomWidth: 0 }]}>
                {/* Avatar */}
                <LinearGradient
                  colors={[colors.wine2, colors.wine]}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {venta.cliente_nombre.slice(0, 2).toUpperCase()}
                  </Text>
                </LinearGradient>

                {/* Info */}
                <View style={styles.saleInfo}>
                  <Text style={styles.saleName}>{venta.cliente_nombre}</Text>
                  <Text style={styles.saleMeta}>
                    {venta.metodo_entrega === 'correos_cr' ? 'Correos CR' : 'Retiro personal'}
                  </Text>
                  {venta.canal_venta?.nombre && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{venta.canal_venta?.nombre}</Text>
                    </View>
                  )}
                </View>

                {/* Monto */}
                <Text style={styles.saleAmount}>
                  ₡{Number(venta.total_cobrado).toLocaleString('es-CR')}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* ── CTAs fijos ── */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => router.push('/sale/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPrimaryText}>+ Registrar venta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => router.push('/(tabs)/inventory')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabSecondaryText}>Ver inventario</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Header buttons
  headerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.wine,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    borderRadius: radius.hero,
    padding: 28,
    overflow: 'hidden',
  },
  heroFrame: {
    position: 'absolute',
    top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,196,154,0.28)',
    borderRadius: 12,
  },
  heroEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.goldSoft,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroAmount: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 52,
    color: '#FBEFE6',
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 10,
  },

  // ── Métricas ──────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 16,
    overflow: 'hidden',
  },
  metricAccentBar: {
    position: 'absolute',
    top: 0, left: 16, right: 16,
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.7,
    borderRadius: 2,
  },
  metricLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.wine,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  metricValue: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 36,
    color: colors.ink,
    lineHeight: 36,
  },
  metricSub: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.ink,
    marginTop: 5,
  },

  // ── Bloque (card) ─────────────────────────────────────────
  block: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 20,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  blockMore: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Fila de venta ─────────────────────────────────────────
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 14,
    color: colors.paper,
  },
  saleInfo: { flex: 1, minWidth: 0 },
  saleName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  saleMeta: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.wine2,
    marginTop: 2,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 5,
    backgroundColor: colors.coralBg,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.wine,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  saleAmount: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },

  // ── Calculadora ───────────────────────────────────────────
  calcDesc: {
    fontFamily: fonts.sansRegular,
    fontSize: 12.5,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  calcLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.wine,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  calcInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    color: colors.ink,
  },
  calcResultRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  calcDivider: { width: 0 },
  calcResult: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 4,
  },
  calcResultLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.ink,
  },
  calcResultValue: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.wine,
  },
  calcResultHint: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  calcExample: {
    backgroundColor: colors.coralBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.coralSoft,
  },
  calcExampleText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.wine2,
    lineHeight: 16,
  },
  calcHint: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // ── CTAs ──────────────────────────────────────────────────
  fabRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.sand,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fabPrimary: {
    flex: 1,
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimaryText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  fabSecondary: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  fabSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.wine,
    fontSize: 13,
  },

  // ── Banner fin de año ─────────────────────────────────────
  yearEndBanner: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.wine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearEndTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.wine,
    marginBottom: 2,
  },
  yearEndSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },
  yearEndArrow: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.wine,
  },
});

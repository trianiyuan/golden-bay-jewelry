// app/tabs/finances.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getResumenMes, getResumenUltimosMeses, getGastosPorCategoria } from '../../lib/queries/finances';
import { ResumenMes } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '../../components/ui/Header';

export default function FinancesScreen() {
  const [mes, setMes] = useState(new Date());
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [historico, setHistorico] = useState<ResumenMes[]>([]);
  const [gastosCat, setGastosCat] = useState<{ nombre: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [r, h, gc] = await Promise.all([
          getResumenMes(mes.getFullYear(), mes.getMonth()),
          getResumenUltimosMeses(5),
          getGastosPorCategoria(mes.getFullYear(), mes.getMonth()),
        ]);
        setResumen(r);
        setHistorico(h);
        setGastosCat(gc);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mes]);

  useFocusEffect(cargar);

  function cambiarMes(delta: number) {
    setMes(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const maxGanancia = Math.max(...historico.map(h => h.ganancia), 1);

  function mensajeMotivacional(): string {
    if (!resumen) return '';
    const mejorMes = historico.reduce((best, h) => h.ganancia > best.ganancia ? h : best, historico[0]);
    if (resumen.ganancia >= mejorMes?.ganancia) return '🎉 ¡Este es tu mejor mes! Sigue así, las joyas están volando.';
    if (resumen.total_ventas === 0) return '🌸 Aún no hay ventas este mes. ¡Vamos!';
    if (resumen.ganancia > 0) return `✨ Vendiste ${resumen.total_ventas} joya${resumen.total_ventas > 1 ? 's' : ''} y te quedaron ₡${resumen.ganancia.toLocaleString('es-CR')} de ganancia.`;
    return '📊 Este mes los gastos superaron las ventas. Revisa tus costos.';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Finanzas" />

      <View style={styles.mesSelector}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.mesBtn}>
          <Text style={styles.mesBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.mesNombre}>
          {format(mes, 'MMMM yyyy', { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.mesBtn}>
          <Text style={styles.mesBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <View style={styles.mainCard}>
          <View style={styles.mainCardRow}>
            <View style={styles.mainCardItem}>
              <Text style={styles.mainCardLabel}>💰 Entraron</Text>
              <Text style={styles.mainCardValue}>
                ₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}
              </Text>
            </View>
            <View style={styles.mainCardItem}>
              <Text style={styles.mainCardLabel}>📦 Gastaste</Text>
              <Text style={styles.mainCardValue}>
                ₡{(resumen?.total_gastos || 0).toLocaleString('es-CR')}
              </Text>
            </View>
          </View>
          <View style={styles.mainCardDivider} />
          <Text style={styles.mainCardGananciaLabel}>✨ Te quedaron</Text>
          <Text style={styles.mainCardGanancia}>
            ₡{(resumen?.ganancia || 0).toLocaleString('es-CR')}
          </Text>
        </View>

        {resumen && (
          <View style={styles.mensajeCard}>
            <Text style={styles.mensajeText}>{mensajeMotivacional()}</Text>
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Ganancias últimos 5 meses</Text>
          {historico.map((h) => {
            const mesActual = h.mes === resumen?.mes;
            const pct = maxGanancia > 0 ? Math.max((h.ganancia / maxGanancia) * 100, 2) : 2;
            return (
              <View key={h.mes} style={styles.barRow}>
                <Text style={[styles.barLabel, mesActual && styles.barLabelActive]}>
                  {format(new Date(h.mes + '-01'), 'MMM', { locale: es })}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }, mesActual && styles.barFillActive]} />
                </View>
                <Text style={[styles.barValue, mesActual && styles.barValueActive]}>
                  ₡{Math.round(h.ganancia / 1000)}k
                </Text>
              </View>
            );
          })}
        </View>

        {gastosCat.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>¿En qué se fueron los gastos?</Text>
            {gastosCat.map(gc => {
              const totalGastos = resumen?.total_gastos || 1;
              const pct = (gc.total / totalGastos) * 100;
              return (
                <View key={gc.nombre} style={styles.gastoRow}>
                  <Text style={styles.gastoNombre}>{gc.nombre}</Text>
                  <View style={styles.gastoBarTrack}>
                    <View style={[styles.gastoBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.gastoMonto}>₡{Math.round(gc.total / 1000)}k</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>VENTAS</Text>
            <Text style={styles.metricSmallValue}>{resumen?.total_ventas || 0}</Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>INGRESOS</Text>
            <Text style={styles.metricSmallValue}>
              ₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}
            </Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>GASTOS</Text>
            <Text style={styles.metricSmallValue}>
              ₡{(resumen?.total_gastos || 0).toLocaleString('es-CR')}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>COSTO</Text>
            <Text style={styles.metricSmallValue}>
              ₡{(resumen?.cogs || 0).toLocaleString('es-CR')}
            </Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>MARGEN</Text>
            <Text style={styles.metricSmallValue}>
              ₡{(resumen?.ganancia_bruta || 0).toLocaleString('es-CR')}
            </Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>INVENTARIO</Text>
            <Text style={styles.metricSmallValue}>
              ₡{(resumen?.valor_inventario || 0).toLocaleString('es-CR')}
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  mesSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SIZES.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  mesBtn: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 4 },
  mesBtnText: { fontSize: 18, color: COLORS.textPrimary },
  mesNombre: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg },
  mainCard: { backgroundColor: COLORS.wine, borderRadius: SIZES.radiusXl, padding: 20, marginBottom: 12 },
  mainCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mainCardItem: { alignItems: 'center' },
  mainCardLabel: { fontSize: 11, color: COLORS.blush, marginBottom: 4 },
  mainCardValue: { fontSize: 18, fontWeight: '600', color: COLORS.surface },
  mainCardDivider: { height: 1, backgroundColor: 'rgba(242,196,176,0.3)', marginBottom: 12 },
  mainCardGananciaLabel: { fontSize: 12, color: COLORS.blush, textAlign: 'center', marginBottom: 4 },
  mainCardGanancia: { fontSize: 32, fontWeight: '700', color: COLORS.surface, textAlign: 'center' },
  mensajeCard: { backgroundColor: COLORS.blush, borderRadius: SIZES.radiusMd, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  mensajeText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  chartCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  barLabel: { fontSize: 11, color: COLORS.textMuted, width: 32, textTransform: 'capitalize' },
  barLabelActive: { color: COLORS.wine, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, backgroundColor: COLORS.rose, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.peach, borderRadius: 4 },
  barFillActive: { backgroundColor: COLORS.wine },
  barValue: { fontSize: 11, color: COLORS.textMuted, width: 34 },
  barValueActive: { color: COLORS.wine, fontWeight: '600' },
  gastoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gastoNombre: { fontSize: 11, color: COLORS.textMuted, width: 90 },
  gastoBarTrack: { flex: 1, height: 8, backgroundColor: COLORS.rose, borderRadius: 4, overflow: 'hidden' },
  gastoBarFill: { height: '100%', backgroundColor: COLORS.blush, borderRadius: 4 },
  gastoMonto: { fontSize: 11, color: COLORS.textMuted, width: 34 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricSmall: { flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  metricSmallLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 4, textAlign: 'center' },
  metricSmallValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});
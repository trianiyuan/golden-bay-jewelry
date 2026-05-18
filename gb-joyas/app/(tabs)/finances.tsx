// app/(tabs)/finances.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
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
        setResumen(r); setHistorico(h); setGastosCat(gc);
      } finally { setLoading(false); }
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
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.mesNombre}>{format(mes, 'MMMM yyyy', { locale: es })}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>›</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.mainCard}>
          <View style={styles.mainCardRow}>
            <View style={styles.mainCardItem}>
              <Text style={styles.mainCardLabel}>💰 Entraron</Text>
              <Text style={styles.mainCardValue}>₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}</Text>
            </View>
            <View style={styles.mainCardItem}>
              <Text style={styles.mainCardLabel}>📦 Gastaste</Text>
              <Text style={styles.mainCardValue}>₡{(resumen?.total_gastos || 0).toLocaleString('es-CR')}</Text>
            </View>
          </View>
          <View style={styles.mainCardDivider} />
          <Text style={styles.mainCardGananciaLabel}>✨ Te quedaron</Text>
          <Text style={styles.mainCardGanancia}>₡{(resumen?.ganancia || 0).toLocaleString('es-CR')}</Text>
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
                <Text style={[styles.barValue, mesActual && styles.barValueActive]}>₡{Math.round(h.ganancia / 1000)}k</Text>
              </View>
            );
          })}
        </View>

        {gastosCat.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>¿En qué se fueron los gastos?</Text>
            {gastosCat.map(gc => {
              const pct = ((gc.total / (resumen?.total_gastos || 1)) * 100);
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
            <Text style={styles.metricSmallValue}>₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}</Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>GASTOS</Text>
            <Text style={styles.metricSmallValue}>₡{(resumen?.total_gastos || 0).toLocaleString('es-CR')}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>COSTO</Text>
            <Text style={styles.metricSmallValue}>₡{(resumen?.cogs || 0).toLocaleString('es-CR')}</Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>MARGEN</Text>
            <Text style={styles.metricSmallValue}>₡{(resumen?.ganancia_bruta || 0).toLocaleString('es-CR')}</Text>
          </View>
          <View style={styles.metricSmall}>
            <Text style={styles.metricSmallLabel}>INVENTARIO</Text>
            <Text style={styles.metricSmallValue}>₡{(resumen?.valor_inventario || 0).toLocaleString('es-CR')}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF8F5', paddingHorizontal: SIZES.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(232,200,184,0.6)' },
  mesBtn: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', paddingHorizontal: 12, paddingVertical: 4 },
  mesBtnText: { fontSize: 18, color: COLORS.textPrimary },
  mesNombre: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg },
  mainCard: { backgroundColor: '#622632', borderRadius: 20, padding: 22, marginBottom: 12, shadowColor: '#622632', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 20 },
  mainCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  mainCardItem: { alignItems: 'center' },
  mainCardLabel: { fontSize: 11, color: 'rgba(255,241,237,0.7)', marginBottom: 4, fontWeight: '500' },
  mainCardValue: { fontSize: 20, fontWeight: '700', color: '#FFF1ED' },
  mainCardDivider: { height: 1, backgroundColor: 'rgba(255,241,237,0.15)', marginBottom: 14 },
  mainCardGananciaLabel: { fontSize: 12, color: 'rgba(255,241,237,0.7)', textAlign: 'center', marginBottom: 6, fontWeight: '500' },
  mainCardGanancia: { fontSize: 36, fontWeight: '700', color: '#FFF1ED', textAlign: 'center', letterSpacing: -0.5 },
  mensajeCard: { backgroundColor: '#ECABA0', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E09080', marginBottom: 12 },
  mensajeText: { fontSize: 13, color: '#3D1010', lineHeight: 20 },
  chartCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', marginBottom: 12, shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  chartTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  barLabel: { fontSize: 11, color: COLORS.textMuted, width: 32, textTransform: 'capitalize' },
  barLabelActive: { color: COLORS.wine, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F5E8E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#ECABA0', borderRadius: 4 },
  barFillActive: { backgroundColor: '#622632' },
  barValue: { fontSize: 11, color: COLORS.textMuted, width: 34 },
  barValueActive: { color: COLORS.wine, fontWeight: '600' },
  gastoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gastoNombre: { fontSize: 11, color: COLORS.textMuted, width: 90 },
  gastoBarTrack: { flex: 1, height: 8, backgroundColor: '#F5E8E0', borderRadius: 4, overflow: 'hidden' },
  gastoBarFill: { height: '100%', backgroundColor: '#ECABA0', borderRadius: 4 },
  gastoMonto: { fontSize: 11, color: COLORS.textMuted, width: 34 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricSmall: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', alignItems: 'center', justifyContent: 'center', shadowColor: '#622632', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  metricSmallLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 4, textAlign: 'center', fontWeight: '600' },
  metricSmallValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
});
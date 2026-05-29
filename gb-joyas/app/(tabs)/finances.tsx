// app/(tabs)/finances.tsx — Boutique theme
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getResumenMes, getResumenUltimosMeses, getGastosPorCategoria } from '../../lib/queries/finances';
import { getVentas } from '../../lib/queries/sales';
import { ResumenMes } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '../../components/ui/Header';
import { generarPDFMensual } from '../../lib/generatePDF';
import { supabase } from '../../lib/supabase';

export default function FinancesScreen() {
  const [mes, setMes] = useState(new Date());
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [historico, setHistorico] = useState<ResumenMes[]>([]);
  const [gastosCat, setGastosCat] = useState<{ nombre: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoPDF, setTipoPDF] = useState<'mensual' | 'anual'>('mensual');
  const [generando, setGenerando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [usarRangoPersonalizado, setUsarRangoPersonalizado] = useState(false);

  const cargar = useCallback(() => {
    async function fetchData() {
      setHistorico([]); setLoading(true);
      try {
        const [r, h, gc] = await Promise.all([
          getResumenMes(mes.getFullYear(), mes.getMonth()),
          getResumenUltimosMeses(6, mes),
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
    if (resumen.ganancia >= mejorMes?.ganancia) return '¡Este es tu mejor mes! Las joyas están volando.';
    if (resumen.total_ventas === 0) return 'Aún no hay ventas este mes. ¡Vamos!';
    if (resumen.ganancia > 0) return `Vendiste ${resumen.total_ventas} joya${resumen.total_ventas > 1 ? 's' : ''} y te quedaron ₡${resumen.ganancia.toLocaleString('es-CR')} de ganancia.`;
    return 'Este mes los gastos superaron las ventas. Revisá tus costos.';
  }

  async function descargarPDF() {
    if (!resumen) return;
    try {
      setGenerando(true);
      if (tipoPDF === 'anual') {
        const año = mes.getFullYear();
        const mesesAnuales = Array.from({ length: 12 }, (_, i) => i);
        const resumenesAnuales = await Promise.all(mesesAnuales.map(m => getResumenMes(año, m)));
        const resumenAnual: typeof resumen = {
          mes: String(año),
          total_ventas: resumenesAnuales.reduce((s, r) => s + r.total_ventas, 0),
          ingresos_ventas: resumenesAnuales.reduce((s, r) => s + r.ingresos_ventas, 0),
          cogs: resumenesAnuales.reduce((s, r) => s + r.cogs, 0),
          ganancia_bruta: resumenesAnuales.reduce((s, r) => s + r.ganancia_bruta, 0),
          total_gastos: resumenesAnuales.reduce((s, r) => s + r.total_gastos, 0),
          ganancia: resumenesAnuales.reduce((s, r) => s + r.ganancia, 0),
          valor_inventario: resumen.valor_inventario,
        };
        const ventasAnuales = await getVentas();
        const ventasAño = ventasAnuales.filter(v => new Date(v.fecha).getFullYear() === año);
        const canalMap: Record<string, number> = {};
        ventasAño.forEach(v => { const n = v.canal_venta?.nombre || 'Otros'; canalMap[n] = (canalMap[n] || 0) + Number(v.total_cobrado); });
        const ventasPorCanal = Object.entries(canalMap).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
        const productoMap: Record<string, { nombre: string; cantidad: number; total: number }> = {};
        ventasAño.forEach(v => { (v.productos || []).forEach((vp: any) => { const n = vp.producto?.nombre || 'Producto'; if (!productoMap[n]) productoMap[n] = { nombre: n, cantidad: 0, total: 0 }; productoMap[n].cantidad += vp.cantidad; productoMap[n].total += vp.precio_unitario * vp.cantidad; }); });
        const topProductos = Object.values(productoMap).sort((a, b) => b.total - a.total);
        const gastosCatAnualData = await Promise.all(mesesAnuales.map(m => getGastosPorCategoria(año, m)));
        const gastosCatAnual: Record<string, number> = {};
        gastosCatAnualData.flat().forEach(g => { gastosCatAnual[g.nombre] = (gastosCatAnual[g.nombre] || 0) + g.total; });
        const gastosPorCategoriaAnual = Object.entries(gastosCatAnual).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
        const canalesData = await supabase.from('canales_venta').select('*');
        const canalesList = canalesData.data || [];
        const comisionesPorCanal: { nombre: string; porcentaje: number; monto: number }[] = [];
        const costosFijosPorCanal: { nombre: string; monto: number }[] = [];
        canalesList.forEach(canal => {
          const ventasCanal = ventasAño.filter(v => v.canal_venta_id === canal.id);
          const totalCanal = ventasCanal.reduce((s, v) => s + Number(v.total_cobrado), 0);
          if (canal.comision_porcentaje > 0 && totalCanal > 0) comisionesPorCanal.push({ nombre: canal.nombre, porcentaje: canal.comision_porcentaje, monto: Math.round(totalCanal * (canal.comision_porcentaje / 100)) });
          if (canal.costo_fijo_mensual > 0) costosFijosPorCanal.push({ nombre: canal.nombre, monto: canal.costo_fijo_mensual * 12 });
        });
        const totalComisiones = comisionesPorCanal.reduce((s, c) => s + c.monto, 0);
        const totalCostosFijos = costosFijosPorCanal.reduce((s, c) => s + c.monto, 0);
        await generarPDFMensual({ resumen: resumenAnual, gastosPorCategoria: gastosPorCategoriaAnual, ventasPorCanal, topProductos, mes: new Date(año, 0, 1), tipo: 'anual', resumenPorMes: resumenesAnuales, comisionesPorCanal, costosFijosPorCanal, ingresoNeto: resumenAnual.ingresos_ventas - totalComisiones - totalCostosFijos });
      } else {
        let ventasFiltradas;
        if (usarRangoPersonalizado && fechaInicio && fechaFin) {
          const todas = await getVentas();
          ventasFiltradas = todas.filter(v => { const fecha = v.fecha.split('T')[0]; return fecha >= fechaInicio && fecha <= fechaFin; });
        } else {
          ventasFiltradas = await getVentas(mes);
        }
        const ventas = ventasFiltradas;
        const canalMap: Record<string, number> = {};
        ventas.forEach(v => { const n = v.canal_venta?.nombre || 'Otros'; canalMap[n] = (canalMap[n] || 0) + Number(v.total_cobrado); });
        const ventasPorCanal = Object.entries(canalMap).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
        const productoMap: Record<string, { nombre: string; cantidad: number; total: number }> = {};
        ventas.forEach(v => { (v.productos || []).forEach((vp: any) => { const n = vp.producto?.nombre || 'Producto'; if (!productoMap[n]) productoMap[n] = { nombre: n, cantidad: 0, total: 0 }; productoMap[n].cantidad += vp.cantidad; productoMap[n].total += vp.precio_unitario * vp.cantidad; }); });
        const topProductos = Object.values(productoMap).sort((a, b) => b.total - a.total);
        let mesesCubiertos = 1;
        if (usarRangoPersonalizado && fechaInicio && fechaFin) {
          const diffDias = (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24);
          mesesCubiertos = Math.max(1, Math.round(diffDias / 30));
        }
        const canalesData = await supabase.from('canales_venta').select('*');
        const canalesList = canalesData.data || [];
        const comisionesPorCanal: { nombre: string; porcentaje: number; monto: number }[] = [];
        const costosFijosPorCanal: { nombre: string; monto: number }[] = [];
        canalesList.forEach(canal => {
          const ventasCanal = ventas.filter(v => v.canal_venta_id === canal.id);
          const totalCanal = ventasCanal.reduce((s, v) => s + Number(v.total_cobrado), 0);
          if (canal.comision_porcentaje > 0 && totalCanal > 0) comisionesPorCanal.push({ nombre: canal.nombre, porcentaje: canal.comision_porcentaje, monto: Math.round(totalCanal * (canal.comision_porcentaje / 100)) });
          if (canal.costo_fijo_mensual > 0) costosFijosPorCanal.push({ nombre: canal.nombre, monto: canal.costo_fijo_mensual * mesesCubiertos });
        });
        const totalComisiones = comisionesPorCanal.reduce((s, c) => s + c.monto, 0);
        const totalCostosFijos = costosFijosPorCanal.reduce((s, c) => s + c.monto, 0);
        await generarPDFMensual({ resumen, gastosPorCategoria: gastosCat, ventasPorCanal, topProductos, mes: usarRangoPersonalizado && fechaInicio ? new Date(fechaInicio) : mes, tipo: 'mensual', rangoPersonalizado: usarRangoPersonalizado ? { inicio: fechaInicio, fin: fechaFin } : undefined, comisionesPorCanal, costosFijosPorCanal, ingresoNeto: resumen.ingresos_ventas - totalComisiones - totalCostosFijos });
      }
    } catch (e: any) {
      console.error('Error generando PDF:', e);
    } finally {
      setGenerando(false);
    }
  }

  const mesesLabel = format(mes, 'MMMM yyyy', { locale: es });

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Finanzas" />

      {/* Selector mes */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{mesesLabel}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Panel principal vino ── */}
        <LinearGradient
          colors={['#6A2233', '#5A1B2B', '#3F1320']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.mainPanel}
        >
          <View style={styles.panelFrame} pointerEvents="none" />
          <View style={styles.mainPanelRow}>
            <View style={styles.mainPanelItem}>
              <Text style={styles.mainPanelLabel}>ENTRARON</Text>
              <Text style={styles.mainPanelValue}>₡{(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}</Text>
            </View>
            <View style={styles.mainPanelDivider} />
            <View style={styles.mainPanelItem}>
              <Text style={styles.mainPanelLabel}>GASTASTE</Text>
              <Text style={styles.mainPanelValue}>₡{(resumen?.total_gastos || 0).toLocaleString('es-CR')}</Text>
            </View>
          </View>
          <View style={styles.mainPanelSep} />
          <Text style={styles.mainPanelGananciaLabel}>TE QUEDARON</Text>
          <Text style={styles.mainPanelGanancia}>₡{(resumen?.ganancia || 0).toLocaleString('es-CR')}</Text>
        </LinearGradient>

        {/* ── Mensaje motivacional ── */}
        {resumen && (
          <View style={styles.mensajeCard}>
            <Text style={styles.mensajeText}>{mensajeMotivacional()}</Text>
          </View>
        )}

        {/* ── Gráfico barras: ganancias ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ganancias últimos 6 meses</Text>
          {historico.map(h => {
            const activo = h.mes === resumen?.mes;
            const pct = maxGanancia > 0 ? Math.max((h.ganancia / maxGanancia) * 100, 2) : 2;
            return (
              <View key={h.mes} style={styles.barRow}>
                <Text style={[styles.barLabel, activo && styles.barLabelActive]}>
                  {format(new Date(h.mes + '-15'), 'MMM', { locale: es })}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` as any }, activo && styles.barFillActive]} />
                </View>
                <Text style={[styles.barValue, activo && styles.barValueActive]}>
                  ₡{h.ganancia.toLocaleString('es-CR')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Gastos por categoría ── */}
        {gastosCat.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>¿En qué se fueron los gastos?</Text>
            {gastosCat.map(gc => {
              const pct = ((gc.total / (resumen?.total_gastos || 1)) * 100);
              return (
                <View key={gc.nombre} style={styles.barRow}>
                  <Text style={styles.barLabel}>{gc.nombre}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={styles.barValue}>₡{Math.round(gc.total / 1000)}k</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Métricas ── */}
        <View style={styles.metricsRow}>
          {[
            { label: 'VENTAS',    value: String(resumen?.total_ventas || 0) },
            { label: 'INGRESOS',  value: `₡${(resumen?.ingresos_ventas || 0).toLocaleString('es-CR')}` },
            { label: 'GASTOS',    value: `₡${(resumen?.total_gastos || 0).toLocaleString('es-CR')}` },
          ].map(m => (
            <View key={m.label} style={styles.metricCard}>
              <View style={styles.metricBar} />
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metricsRow}>
          {[
            { label: 'COSTO',       value: `₡${(resumen?.cogs || 0).toLocaleString('es-CR')}` },
            { label: 'MARGEN',      value: `₡${(resumen?.ganancia_bruta || 0).toLocaleString('es-CR')}` },
            { label: 'INVENTARIO',  value: `₡${(resumen?.valor_inventario || 0).toLocaleString('es-CR')}` },
          ].map(m => (
            <View key={m.label} style={styles.metricCard}>
              <View style={styles.metricBar} />
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* ── PDF ── */}
        <View style={styles.pdfCard}>
          {/* Header vino */}
          <LinearGradient
            colors={['#6A2233', '#5A1B2B', '#3F1320']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.pdfHeader}
          >
            <View style={styles.pdfHeaderIcon}>
              <Text style={styles.pdfHeaderIconText}>↓</Text>
            </View>
            <View>
              <Text style={styles.pdfHeaderTitle}>Generar reporte</Text>
              <Text style={styles.pdfHeaderSub}>Exportá tus datos financieros en PDF</Text>
            </View>
          </LinearGradient>

          {/* Tipo: mensual / anual */}
          <View style={styles.pdfTipoRow}>
            {(['mensual', 'anual'] as const).map(tipo => (
              <TouchableOpacity
                key={tipo}
                style={[styles.tipoBtn, tipoPDF === tipo && styles.tipoBtnActive]}
                onPress={() => setTipoPDF(tipo)}
                activeOpacity={0.85}
              >
                <View style={styles.tipoContent}>
                  <Text style={[styles.tipoIcon, tipoPDF === tipo && styles.tipoIconActive]}>
                    {tipo === 'mensual' ? '▦' : '▤'}
                  </Text>
                  <View>
                    <Text style={[styles.tipoName, tipoPDF === tipo && styles.tipoNameActive]}>
                      {tipo === 'mensual' ? 'Mensual' : 'Anual'}
                    </Text>
                    <Text style={styles.tipoDesc}>
                      {tipo === 'mensual' ? mesesLabel : String(mes.getFullYear())}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tipoCheck, tipoPDF === tipo && styles.tipoCheckActive]}>
                  {tipoPDF === tipo && <View style={styles.tipoCheckInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rango personalizado */}
          {tipoPDF === 'mensual' && (
            <View style={styles.rangoWrap}>
              <TouchableOpacity
                style={[styles.rangoToggle, usarRangoPersonalizado && styles.rangoToggleActive]}
                onPress={() => setUsarRangoPersonalizado(prev => !prev)}
              >
                <Text style={[styles.rangoToggleText, usarRangoPersonalizado && { color: colors.paper }]}>
                  {usarRangoPersonalizado ? '✓ Rango personalizado activo' : 'Usar rango de fechas personalizado'}
                </Text>
              </TouchableOpacity>
              {usarRangoPersonalizado && (
                <View style={styles.rangoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangoLabel}>DESDE</Text>
                    <TextInput style={styles.rangoInput} value={fechaInicio} onChangeText={setFechaInicio} placeholder="2026-05-01" placeholderTextColor={colors.muted2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangoLabel}>HASTA</Text>
                    <TextInput style={styles.rangoInput} value={fechaFin} onChangeText={setFechaFin} placeholder="2026-05-31" placeholderTextColor={colors.muted2} />
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.pdfDivider} />

          {/* Contenido incluido */}
          <Text style={styles.pdfContenidoLabel}>INCLUYE</Text>
          <View style={styles.pdfContenidoGrid}>
            {['Resumen financiero', 'Estado de resultados', 'Ventas por canal', 'Top productos', 'Gastos por categoría', 'Valor inventario'].map(item => (
              <View key={item} style={styles.pdfContenidoItem}>
                <View style={styles.pdfDot} />
                <Text style={styles.pdfContenidoText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Botón descargar */}
          <TouchableOpacity
            style={[styles.downloadBtn, generando && { opacity: 0.7 }]}
            onPress={descargarPDF}
            disabled={generando}
            activeOpacity={0.85}
          >
            {generando ? (
              <ActivityIndicator color={colors.paper} size="small" />
            ) : (
              <>
                <Text style={styles.downloadIcon}>↓</Text>
                <View>
                  <Text style={styles.downloadText}>Descargar PDF</Text>
                  <Text style={styles.downloadSub}>
                    {tipoPDF === 'mensual' ? mesesLabel : String(mes.getFullYear())} · ~2 segundos
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F0E8DF' },
scroll: { flex: 1, backgroundColor: '#F0E8DF' },
  content: { padding: 20, paddingBottom: 40 },

  // ── Mes ───────────────────────────────────────────────────
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cream, paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  monthArrow: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  monthArrowText: { fontFamily: fonts.serifSemiBold, fontSize: 20, color: colors.wine, lineHeight: 24 },
  monthLabel: { fontFamily: fonts.serifSemiBold, fontSize: 19, color: colors.ink, textTransform: 'capitalize' },

  // ── Panel principal ───────────────────────────────────────
  mainPanel: { borderRadius: radius.hero, padding: 28, overflow: 'hidden', marginBottom: 14 },
  panelFrame: {
    position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 1, borderColor: 'rgba(226,196,154,0.28)', borderRadius: 12,
  },
  mainPanelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  mainPanelItem: { flex: 1, alignItems: 'center' },
  mainPanelDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  mainPanelLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.goldSoft,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
  },
  mainPanelValue: { fontFamily: fonts.serifSemiBold, fontSize: 22, color: '#FBEFE6' },
  mainPanelSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 16 },
  mainPanelGananciaLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.goldSoft,
    letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8,
  },
  mainPanelGanancia: {
    fontFamily: fonts.serifSemiBold, fontSize: 52, color: '#FBEFE6',
    textAlign: 'center', lineHeight: 52, letterSpacing: -0.5,
  },

  // ── Mensaje motivacional ──────────────────────────────────
  mensajeCard: {
  backgroundColor: colors.cream,
  borderRadius: 14,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.goldLine,  // borde dorado en vez de coral
  marginBottom: 14,
},
  mensajeText: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.wine2, lineHeight: 22 },

  // ── Card genérica ─────────────────────────────────────────
  card: {
    backgroundColor: colors.cream, borderRadius: radius.card, padding: 18,
    borderWidth: 1, borderColor: colors.line, marginBottom: 14,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 16 },

  // ── Barras ────────────────────────────────────────────────
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, width: 36, textTransform: 'capitalize' },
  barLabelActive: { fontFamily: fonts.sansSemiBold, color: colors.wine },
  barTrack: { flex: 1, height: 7, backgroundColor: colors.coralBg, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.coralSoft, borderRadius: 4 },
  barFillActive: { backgroundColor: colors.wine },
  barValue: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, width: 72, textAlign: 'right' },
  barValueActive: { fontFamily: fonts.sansSemiBold, color: colors.wine },

  // ── Métricas ──────────────────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.card, padding: 14,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', overflow: 'hidden',
  },
  metricBar: {
    position: 'absolute', top: 0, left: 14, right: 14, height: 2,
    backgroundColor: colors.gold, opacity: 0.7,
  },
  metricLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.muted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 6,
  },
  metricValue: { fontFamily: fonts.serifSemiBold, fontSize: 16, color: colors.ink, textAlign: 'center' },

  // ── PDF card ──────────────────────────────────────────────
  pdfCard: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.line, marginTop: 8, overflow: 'hidden',
  },
  pdfHeader: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pdfHeaderIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  pdfHeaderIconText: { fontFamily: fonts.serifSemiBold, fontSize: 20, color: colors.paper },
  pdfHeaderTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.paper },
  pdfHeaderSub:   { fontFamily: fonts.sansRegular, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  pdfTipoRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0 },
  tipoBtn: {
    flex: 1, borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tipoBtnActive: { borderColor: colors.wine, backgroundColor: colors.coralBg },
  tipoContent:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipoIcon:      { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.muted },
  tipoIconActive:{ color: colors.wine },
  tipoName:      { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  tipoNameActive:{ color: colors.wine },
  tipoDesc:      { fontFamily: fonts.sansRegular, fontSize: 10, color: colors.muted, marginTop: 1, textTransform: 'capitalize' },
  tipoCheck: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  tipoCheckActive: { backgroundColor: colors.wine, borderColor: colors.wine },
  tipoCheckInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.paper },

  rangoWrap: { paddingHorizontal: 16, paddingTop: 12 },
  rangoToggle: {
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper,
    alignItems: 'center', marginBottom: 10,
  },
  rangoToggleActive: { backgroundColor: colors.wine, borderColor: colors.wine },
  rangoToggleText:   { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.wine },
  rangoRow:   { flexDirection: 'row', gap: 10 },
  rangoLabel: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.muted, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
  rangoInput: {
    borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 9,
    padding: 10, fontFamily: fonts.sansRegular, fontSize: 13,
    color: colors.ink, backgroundColor: colors.paper,
  },

  pdfDivider: { height: 1, backgroundColor: colors.line, margin: 16, marginBottom: 12 },
  pdfContenidoLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.muted,
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 10,
  },
  pdfContenidoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  pdfContenidoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
  pdfDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  pdfContenidoText: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted },

  downloadBtn: {
    margin: 16, marginTop: 0, backgroundColor: colors.wine,
    borderRadius: radius.button, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  downloadIcon: { fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.paper },
  downloadText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.paper },
  downloadSub:  { fontFamily: fonts.sansRegular, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1, textTransform: 'capitalize' },
});

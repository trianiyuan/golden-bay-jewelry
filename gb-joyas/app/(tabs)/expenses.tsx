// app/(tabs)/expenses.tsx — Boutique theme
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { getGastos, createGasto, updateGasto, eliminarGasto, getCategoriasGasto } from '../../lib/queries/sales';
import { Gasto, CategoriaGasto } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/Header';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type FormData = { monto: string; notas: string; };

export default function ExpensesScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [mes, setMes] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [gastoAEliminar, setGastoAEliminar] = useState<Gasto | null>(null);
  const [catSeleccionada, setCatSeleccionada] = useState('');
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { monto: '', notas: '' },
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c] = await Promise.all([getGastos(mes), getCategoriasGasto()]);
      setGastos(g); setCategorias(c);
      if (c.length > 0 && !catSeleccionada) setCatSeleccionada(c[0].id);
    } finally { setLoading(false); }
  }, [mes]);

  useFocusEffect(cargar);

  function cambiarMes(delta: number) {
    setMes(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function abrirAgregar() {
    setGastoEditando(null);
    reset({ monto: '', notas: '' });
    if (categorias.length > 0) setCatSeleccionada(categorias[0].id);
    setModalAgregar(true);
  }

  function abrirEditar(gasto: Gasto) {
    setGastoEditando(gasto);
    setCatSeleccionada(gasto.categoria_gasto_id);
    reset({ monto: String(gasto.monto), notas: gasto.notas || '' });
    setModalAgregar(true);
  }

  async function guardar(data: FormData) {
    if (!catSeleccionada) { Alert.alert('Seleccioná una categoría'); return; }
    try {
      setSaving(true);
      if (gastoEditando) {
        await updateGasto(gastoEditando.id, {
          monto: parseFloat(data.monto),
          notas: data.notas.trim() || undefined,
          categoria_gasto_id: catSeleccionada,
        });
      } else {
        await createGasto({
          monto: parseFloat(data.monto),
          notas: data.notas.trim() || undefined,
          categoria_gasto_id: catSeleccionada,
          fecha: new Date().toISOString().split('T')[0],
        });
      }
      reset(); setModalAgregar(false); setGastoEditando(null); cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  }

  async function ejecutarEliminar() {
    if (!gastoAEliminar) return;
    try {
      await eliminarGasto(gastoAEliminar.id);
      setGastoAEliminar(null); cargar();
    } catch (e: any) {
      setGastoAEliminar(null);
      Alert.alert('Error', e.message || 'No se pudo eliminar.');
    }
  }

  const totalMes = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  const porCategoria: Record<string, number> = {};
  gastos.forEach(g => {
    const n = g.categoria?.nombre || 'Otros';
    porCategoria[n] = (porCategoria[n] || 0) + Number(g.monto);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Gastos" rightElement={
        <TouchableOpacity style={styles.btnAdd} onPress={abrirAgregar} activeOpacity={0.85}>
          <Text style={styles.btnAddText}>+ Agregar</Text>
        </TouchableOpacity>
      } />

      {/* Selector de mes */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{format(mes, 'MMMM yyyy', { locale: es })}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Panel total vino */}
        <LinearGradient
          colors={['#6A2233', '#5A1B2B', '#3F1320']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.totalPanel}
        >
          <View style={styles.totalFrame} pointerEvents="none" />
          <View>
            <Text style={styles.totalEyebrow}>TOTAL GASTOS · {format(mes, 'MMMM', { locale: es }).toUpperCase()}</Text>
            <Text style={styles.totalMonto}>₡{totalMes.toLocaleString('es-CR')}</Text>
          </View>
          {Object.keys(porCategoria).length > 0 && (
            <View style={styles.desglose}>
              {Object.entries(porCategoria).map(([nombre, monto]) => (
                <View key={nombre} style={styles.desgloseRow}>
                  <View style={styles.desgloseDot} />
                  <Text style={styles.desgloseNombre} numberOfLines={1}>{nombre}</Text>
                  <Text style={styles.desgloseMonto}>₡{Math.round(monto / 1000)}k</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Historial */}
        <Text style={styles.sectionTitle}>HISTORIAL</Text>

        {gastos.length > 0 && (
          <View style={styles.listCard}>
            {gastos.map((gasto, i) => (
              <View
                key={gasto.id}
                style={[styles.gastoRow, i === gastos.length - 1 && { borderBottomWidth: 0 }]}
              >
                {/* Ícono categoría */}
                <View style={styles.gastoIcon}>
                  <Text style={styles.gastoIconText}>
                    {gasto.categoria?.nombre?.includes('Compra') ? '▽'
                      : gasto.categoria?.nombre?.includes('Envío') ? '→'
                      : gasto.categoria?.nombre?.includes('Empaque') ? '□'
                      : '◇'}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.gastoInfo}>
                  <Text style={styles.gastoCategoria}>{gasto.categoria?.nombre}</Text>
                  {gasto.notas ? (
                    <Text style={styles.gastoNota} numberOfLines={1}>"{gasto.notas}"</Text>
                  ) : null}
                  <Text style={styles.gastoFecha}>
                    {format(new Date(gasto.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es })}
                  </Text>
                </View>

                {/* Monto + acciones */}
                <View style={styles.gastoRight}>
                  <Text style={styles.gastoMonto}>
                    ₡{Number(gasto.monto).toLocaleString('es-CR')}
                  </Text>
                  <View style={styles.gastoActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => abrirEditar(gasto)}>
                      <Text style={styles.iconBtnText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => setGastoAEliminar(gasto)}>
                      <Text style={[styles.iconBtnText, { color: colors.wine }]}>⌫</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {gastos.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No hay gastos en {format(mes, 'MMMM', { locale: es })}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ════ MODAL AGREGAR/EDITAR ════ */}
      <Modal visible={modalAgregar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setModalAgregar(false); setGastoEditando(null); reset(); }}>
                <Text style={styles.modalCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>{gastoEditando ? 'Editar gasto' : 'Nuevo gasto'}</Text>
              <TouchableOpacity onPress={handleSubmit(guardar)} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={colors.wine} size="small" />
                  : <Text style={styles.modalGuardar}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>CATEGORÍA</Text>
              <View style={styles.pillsWrap}>
                {categorias.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pill, catSeleccionada === c.id && styles.pillActive]}
                    onPress={() => setCatSeleccionada(c.id)}
                  >
                    <Text style={[styles.pillText, catSeleccionada === c.id && styles.pillTextActive]}>
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Controller
                control={control} name="monto"
                rules={{ required: 'El monto es obligatorio', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Monto inválido' } }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Monto (₡)" value={value}
                    onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric" placeholder="45 000" error={errors.monto?.message} />
                )}
              />

              <Controller
                control={control} name="notas"
                render={({ field: { onChange, value } }) => (
                  <Input label="Notas (opcional)" value={value} onChangeText={onChange}
                    placeholder="Ej: compré 10 pares a la proveedora"
                    multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
                )}
              />

              {gastoEditando && (
                <TouchableOpacity
                  style={styles.btnEliminarModal}
                  onPress={() => { setModalAgregar(false); setGastoAEliminar(gastoEditando); setGastoEditando(null); }}
                >
                  <Text style={styles.btnEliminarModalText}>Eliminar este gasto</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════ MODAL CONFIRMAR ELIMINAR ════ */}
      <Modal visible={!!gastoAEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar gasto</Text>
            <Text style={styles.confirmMensaje}>
              ¿Eliminás este gasto de ₡{Number(gastoAEliminar?.monto || 0).toLocaleString('es-CR')}? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setGastoAEliminar(null)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarEliminar}>
                <Text style={styles.confirmEliminarText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 safe:   { flex: 1, backgroundColor: '#F0E8DF' },
scroll: { flex: 1, backgroundColor: '#F0E8DF' },
  content: { padding: 20, paddingBottom: 40 },

  btnAdd: {
    backgroundColor: colors.wine,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  btnAddText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.paper,
    letterSpacing: 0.2,
  },

  // ── Mes ───────────────────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  monthArrow: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  monthArrowText: { fontFamily: fonts.serifSemiBold, fontSize: 20, color: colors.wine, lineHeight: 24 },
  monthLabel: { fontFamily: fonts.serifSemiBold, fontSize: 19, color: colors.ink, textTransform: 'capitalize' },

  // ── Panel total ───────────────────────────────────────────
  totalPanel: {
    borderRadius: radius.hero,
    padding: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  totalFrame: {
    position: 'absolute',
    top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,196,154,0.28)',
    borderRadius: 12,
  },
  totalEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.goldSoft,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  totalMonto: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 52,
    color: '#FBEFE6',
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  desglose:    { gap: 6 },
  desgloseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  desgloseDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.goldSoft },
  desgloseNombre: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  desgloseMonto: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 14,
    color: colors.goldSoft,
  },

  // ── Lista ─────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.wine,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  gastoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  gastoIcon: {
    width: 40, height: 40,
    borderRadius: radius.avatar,
    backgroundColor: colors.coralBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  gastoIconText: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.wine },
  gastoInfo: { flex: 1, minWidth: 0 },
  gastoCategoria: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  gastoNota: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    color: colors.wine2,
    marginTop: 2,
  },
  gastoFecha: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, marginTop: 3 },
  gastoRight: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  gastoMonto: { fontFamily: fonts.serifSemiBold, fontSize: 20, color: colors.ink, letterSpacing: -0.2 },
  gastoActions: { flexDirection: 'row', gap: 7 },
  iconBtn: {
    width: 34, height: 34,
    borderRadius: radius.iconBtn,
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: 'rgba(90,27,43,0.2)' },
  iconBtnText: { fontSize: 15, color: colors.muted },

  // ── Vacío ─────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    textTransform: 'capitalize',
  },

  // ── Modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44,26,28,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.sand,
    borderRadius: 20,
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  modalCancelar: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.wine },
  modalTitulo:   { fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.ink },
  modalGuardar:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.wine },
  modalBody: { padding: 20, paddingBottom: 40 },

  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  pillActive:     { backgroundColor: colors.wine, borderColor: colors.wine },
  pillText:       { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  pillTextActive: { color: colors.paper },

  btnEliminarModal: {
    marginTop: 24,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(90,27,43,0.2)',
    alignItems: 'center',
  },
  btnEliminarModalText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.wine },

  // ── Confirm eliminar ──────────────────────────────────────
  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(26,10,10,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  confirmBox: {
    backgroundColor: colors.cream, borderRadius: 20, padding: 24,
    maxWidth: 480, width: '100%', alignSelf: 'center',
    borderWidth: 1, borderColor: colors.line,
  },
  confirmTitulo:  { fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.ink, marginBottom: 8 },
  confirmMensaje: { fontFamily: fonts.sansRegular, fontSize: 13, color: colors.muted, marginBottom: 24, lineHeight: 20 },
  confirmBtns:    { flexDirection: 'row', gap: 10 },
  confirmCancelar: {
    flex: 1, padding: 14, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.gold, alignItems: 'center',
  },
  confirmCancelarText: { fontFamily: fonts.sansSemiBold, color: colors.wine, fontSize: 14 },
  confirmEliminar: {
    flex: 1, padding: 14, borderRadius: radius.button,
    backgroundColor: colors.wine, alignItems: 'center',
  },
  confirmEliminarText: { fontFamily: fonts.sansSemiBold, color: colors.paper, fontSize: 14 },
});

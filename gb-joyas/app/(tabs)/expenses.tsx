// app/(tabs)/expenses.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { getGastos, createGasto, updateGasto, eliminarGasto, getCategoriasGasto } from '../../lib/queries/sales';
import { Gasto, CategoriaGasto } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';
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
    setGastoEditando(null); reset({ monto: '', notas: '' });
    if (categorias.length > 0) setCatSeleccionada(categorias[0].id);
    setModalAgregar(true);
  }

  function abrirEditar(gasto: Gasto) {
    setGastoEditando(gasto); setCatSeleccionada(gasto.categoria_gasto_id);
    reset({ monto: String(gasto.monto), notas: gasto.notas || '' });
    setModalAgregar(true);
  }

  async function guardar(data: FormData) {
    if (!catSeleccionada) { Alert.alert('Seleccioná una categoría'); return; }
    try {
      setSaving(true);
      if (gastoEditando) {
        await updateGasto(gastoEditando.id, { monto: parseFloat(data.monto), notas: data.notas.trim() || undefined, categoria_gasto_id: catSeleccionada });
      } else {
        await createGasto({ monto: parseFloat(data.monto), notas: data.notas.trim() || undefined, categoria_gasto_id: catSeleccionada, fecha: new Date().toISOString().split('T')[0] });
      }
      reset(); setModalAgregar(false); setGastoEditando(null); cargar();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  }

  async function ejecutarEliminar() {
    if (!gastoAEliminar) return;
    try {
      await eliminarGasto(gastoAEliminar.id); setGastoAEliminar(null); cargar();
    } catch (e: any) { setGastoAEliminar(null); Alert.alert('Error', e.message || 'No se pudo eliminar.'); }
  }

  const totalMes = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  const porCategoria: Record<string, number> = {};
  gastos.forEach(g => { const n = g.categoria?.nombre || 'Otros'; porCategoria[n] = (porCategoria[n] || 0) + Number(g.monto); });

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Gastos" rightElement={
        <TouchableOpacity style={styles.btnAgregar} onPress={abrirAgregar} activeOpacity={0.85}>
          <Text style={styles.btnAgregarText}>+ Agregar</Text>
        </TouchableOpacity>
      } />

      <View style={styles.mesSelector}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.mesNombre}>{format(mes, 'MMMM yyyy', { locale: es })}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>›</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>TOTAL GASTOS</Text>
            <Text style={styles.totalMonto}>₡{totalMes.toLocaleString('es-CR')}</Text>
          </View>
          <View style={styles.desglose}>
            {Object.entries(porCategoria).map(([nombre, monto]) => (
              <View key={nombre} style={styles.desgloseItem}>
                <View style={styles.desgloseDot} />
                <Text style={styles.desgloseNombre} numberOfLines={1}>{nombre}</Text>
                <Text style={styles.desgloseMonto}>₡{Math.round(monto / 1000)}k</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>HISTORIAL</Text>
        {gastos.map(gasto => (
          <View key={gasto.id} style={styles.gastoCard}>
            <View style={styles.gastoMain}>
              <View style={styles.gastoIcon}>
                <Text style={{ fontSize: 18 }}>
                  {gasto.categoria?.nombre?.includes('Compra') ? '📦' : gasto.categoria?.nombre?.includes('Envío') ? '🚚' : gasto.categoria?.nombre?.includes('Empaque') ? '🎁' : '💰'}
                </Text>
              </View>
              <View style={styles.gastoInfo}>
                <Text style={styles.gastoCategoria}>{gasto.categoria?.nombre}</Text>
                {gasto.notas ? <Text style={styles.gastoNota} numberOfLines={1}>{gasto.notas}</Text> : null}
                <Text style={styles.gastoFecha}>{format(new Date(gasto.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es })}</Text>
              </View>
              <Text style={styles.gastoMonto}>₡{Number(gasto.monto).toLocaleString('es-CR')}</Text>
            </View>
            <View style={styles.gastoAcciones}>
              <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(gasto)}>
                <Text style={styles.btnEditarText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnEliminar} onPress={() => setGastoAEliminar(gasto)}>
                <Text style={styles.btnEliminarText}>🗑 Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {gastos.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay gastos en {format(mes, 'MMMM', { locale: es })}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal agregar/editar gasto */}
      <Modal visible={modalAgregar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setModalAgregar(false); setGastoEditando(null); reset(); }}>
                <Text style={styles.modalCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>{gastoEditando ? 'Editar gasto' : 'Nuevo gasto'}</Text>
              <TouchableOpacity onPress={handleSubmit(guardar)} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.wine} size="small" /> : <Text style={styles.modalGuardar}>Guardar</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
              <Text style={styles.fieldLabel}>CATEGORÍA</Text>
              <View style={styles.catGrid}>
                {categorias.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.catChip, catSeleccionada === c.id && styles.catChipActive]} onPress={() => setCatSeleccionada(c.id)}>
                    <Text style={[styles.catChipText, catSeleccionada === c.id && styles.catChipTextActive]}>{c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Controller control={control} name="monto"
                rules={{ required: 'El monto es obligatorio', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Monto inválido' } }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Monto (₡)" value={value} onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric" placeholder="45000" error={errors.monto?.message} />
                )} />
              <Controller control={control} name="notas"
                render={({ field: { onChange, value } }) => (
                  <Input label="Notas (opcional)" value={value} onChangeText={onChange}
                    placeholder="Ej: compré 10 pares a la proveedora" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
                )} />
              {gastoEditando && (
                <TouchableOpacity style={styles.btnEliminarModal} onPress={() => { setModalAgregar(false); setGastoAEliminar(gastoEditando); setGastoEditando(null); }}>
                  <Text style={styles.btnEliminarModalText}>🗑 Eliminar este gasto</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal visible={!!gastoAEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar gasto</Text>
            <Text style={styles.confirmMensaje}>¿Eliminás este gasto de ₡{Number(gastoAEliminar?.monto || 0).toLocaleString('es-CR')}? Esta acción no se puede deshacer.</Text>
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
  safe: { flex: 1, backgroundColor: COLORS.surface },
  btnAgregar: { backgroundColor: COLORS.wine, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnAgregarText: { fontSize: 12, fontWeight: '600', color: COLORS.surface },
  mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF8F5', paddingHorizontal: SIZES.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(232,200,184,0.6)' },
  mesBtn: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', paddingHorizontal: 12, paddingVertical: 4 },
  mesBtnText: { fontSize: 18, color: COLORS.textPrimary },
  mesNombre: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg },
  totalCard: { backgroundColor: '#ECABA0', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E09080', marginBottom: 16, shadowColor: '#ECABA0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16 },
  totalLabel: { fontSize: 9, color: '#7A3030', letterSpacing: 0.9, marginBottom: 4, fontWeight: '600' },
  totalMonto: { fontSize: 30, fontWeight: '700', color: '#3D1010', marginBottom: 12, letterSpacing: -0.5 },
  desglose: { gap: 6 },
  desgloseItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  desgloseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#622632' },
  desgloseNombre: { flex: 1, fontSize: 12, color: '#7A3030' },
  desgloseMonto: { fontSize: 12, fontWeight: '600', color: '#3D1010' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#8F5C52', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  gastoCard: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', marginBottom: 8, overflow: 'hidden', shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  gastoMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  gastoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center' },
  gastoInfo: { flex: 1 },
  gastoCategoria: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  gastoNota: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  gastoFecha: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  gastoMonto: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  gastoAcciones: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(232,200,184,0.5)' },
  btnEditar: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(232,200,184,0.5)' },
  btnEditarText: { fontSize: 12, color: COLORS.wine, fontWeight: '500' },
  btnEliminar: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  btnEliminarText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textTransform: 'capitalize' },

  // Modal agregar/editar
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: COLORS.background, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { backgroundColor: COLORS.surface, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(232,200,184,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalCancelar: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  modalTitulo: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  modalGuardar: { fontSize: 14, color: COLORS.wine, fontWeight: '600' },
  fieldLabel: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', backgroundColor: 'white' },
  catChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  catChipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  catChipTextActive: { color: COLORS.surface },
  btnEliminarModal: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', alignItems: 'center' },
  btnEliminarModalText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  // Modal confirmar eliminar
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: { backgroundColor: '#FFF1ED', borderRadius: 20, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  confirmTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  confirmMensaje: { fontSize: 13, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancelar: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(232,200,184,0.8)', alignItems: 'center' },
  confirmCancelarText: { color: COLORS.textPrimary, fontWeight: '500', fontSize: 14 },
  confirmEliminar: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: COLORS.wine, alignItems: 'center', shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  confirmEliminarText: { color: COLORS.surface, fontWeight: '600', fontSize: 14 },
});
// app/(tabs)/sales.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { getVentas, updateVenta, eliminarVenta, getCanalesVenta } from '../../lib/queries/sales';
import { Venta } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';
import { PageHeader } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
type FormEdit = { cliente_nombre: string; notas: string; total_recibido: string; };

export default function SalesScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [canales, setCanales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date());
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<Venta | null>(null);
  const [canalEditando, setCanalEditando] = useState('');
  const [metodoEditando, setMetodoEditando] = useState<'correos_cr' | 'retiro_personal'>('correos_cr');
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormEdit>({
    defaultValues: { cliente_nombre: '', notas: '', total_recibido: '' },
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c] = await Promise.all([getVentas(mes), getCanalesVenta()]);
      setVentas(v); setCanales(c);
    } finally { setLoading(false); }
  }, [mes]);

  useFocusEffect(cargar);

  function cambiarMes(delta: number) {
    setMes(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function totalUnidades(venta: Venta): number {
    return (venta.productos || []).reduce((sum: number, vp: any) => sum + (vp.cantidad || 1), 0);
  }

  function abrirEditar(venta: Venta) {
    setVentaSeleccionada(venta);
    setCanalEditando((venta as any).canal_venta_id || '');
    setMetodoEditando(venta.metodo_entrega);
    reset({ cliente_nombre: venta.cliente_nombre, notas: venta.notas || '', total_recibido: String(venta.total_recibido) });
    setModalEditar(true);
  }

  async function guardarEdicion(data: FormEdit) {
    if (!ventaSeleccionada) return;
    try {
      setSaving(true);
      await updateVenta(ventaSeleccionada.id, {
        cliente_nombre: data.cliente_nombre.trim(),
        notas: data.notas.trim() || undefined,
        total_recibido: parseFloat(data.total_recibido) || ventaSeleccionada.total_recibido,
        canal_venta_id: canalEditando || undefined,
        metodo_entrega: metodoEditando,
      });
      setModalEditar(false); cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar la venta.');
    } finally { setSaving(false); }
  }

  function confirmarEliminar(venta: Venta) { setVentaAEliminar(venta); setModalEditar(false); }

  async function ejecutarEliminar() {
    if (!ventaAEliminar) return;
    try {
      await eliminarVenta(ventaAEliminar.id);
      setVentaAEliminar(null); cargar();
    } catch (e: any) {
      setVentaAEliminar(null);
      Alert.alert('Error', e.message || 'No se pudo eliminar la venta.');
    }
  }

  const totalMes = ventas.reduce((sum, v) => sum + Number(v.total_cobrado), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Ventas" rightElement={
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/sale/new')} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>+ Agregar</Text>
        </TouchableOpacity>
      } />

      <View style={styles.mesSelector}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.mesNombre}>{MESES[mes.getMonth()]} {mes.getFullYear()}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.mesBtn}><Text style={styles.mesBtnText}>›</Text></TouchableOpacity>
      </View>

      {ventas.length > 0 && (
        <View style={styles.resumenBar}>
          <Text style={styles.resumenText}>{ventas.length} venta{ventas.length > 1 ? 's' : ''}</Text>
          <Text style={styles.resumenTotal}>₡{totalMes.toLocaleString('es-CR')}</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {ventas.map(venta => {
          const unidades = totalUnidades(venta);
          return (
            <View key={venta.id} style={styles.ventaCard}>
              <TouchableOpacity style={styles.ventaMain} onPress={() => abrirEditar(venta)} activeOpacity={0.85}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{venta.cliente_nombre.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.ventaInfo}>
                  <Text style={styles.ventaNombre}>{venta.cliente_nombre}</Text>
                  <Text style={styles.ventaDetalle} numberOfLines={1}>
                    {unidades} unidad{unidades !== 1 ? 'es' : ''} · {venta.metodo_entrega === 'correos_cr' ? 'Correos CR' : 'Retiro personal'} · {new Date(venta.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
                  </Text>
                  {(venta as any).canal_venta?.nombre && (
                    <View style={styles.canalBadge}><Text style={styles.canalText}>{(venta as any).canal_venta.nombre}</Text></View>
                  )}
                  {venta.notas ? <Text style={styles.ventaNota} numberOfLines={1}>💬 {venta.notas}</Text> : null}
                </View>
                <View style={styles.ventaMonto}>
                  <Text style={styles.ventaMontoText}>₡{Math.round(Number(venta.total_cobrado) / 1000)}k</Text>
                  {Number(venta.total_recibido) < Number(venta.total_cobrado) && (
                    <View style={styles.pendienteBadge}><Text style={styles.pendienteText}>Pendiente</Text></View>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.ventaAcciones}>
                <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(venta)}>
                  <Text style={styles.btnEditarText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnEliminar} onPress={() => confirmarEliminar(venta)}>
                  <Text style={styles.btnEliminarText}>🗑 Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {ventas.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>Sin ventas en {MESES[mes.getMonth()]}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/sale/new')}>
              <Text style={styles.emptyBtnText}>Registrar primera venta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalEditar} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalEditar(false); setVentaSeleccionada(null); }}>
              <Text style={styles.modalCancelar}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Editar venta</Text>
            <TouchableOpacity onPress={handleSubmit(guardarEdicion)} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.wine} size="small" /> : <Text style={styles.modalGuardar}>Guardar</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Controller control={control} name="cliente_nombre" rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Nombre del cliente *" value={value} onChangeText={onChange} error={errors.cliente_nombre?.message} />
              )} />
            <Text style={styles.fieldLabel}>CANAL DE VENTA</Text>
            <View style={styles.canalesGrid}>
              {canales.map(canal => (
                <TouchableOpacity key={canal.id} style={[styles.canalChip, canalEditando === canal.id && styles.canalChipActive]} onPress={() => setCanalEditando(canal.id)}>
                  <Text style={[styles.canalChipText, canalEditando === canal.id && styles.canalChipTextActive]}>{canal.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>MÉTODO DE ENTREGA</Text>
            <View style={styles.entregaOptions}>
              {[{ key: 'correos_cr', label: 'Correos CR', emoji: '📬' }, { key: 'retiro_personal', label: 'Retiro personal', emoji: '🤝' }].map(opt => (
                <TouchableOpacity key={opt.key} style={[styles.entregaOpt, metodoEditando === opt.key && styles.entregaOptActive]} onPress={() => setMetodoEditando(opt.key as any)}>
                  <Text style={styles.entregaEmoji}>{opt.emoji}</Text>
                  <Text style={styles.entregaLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Controller control={control} name="total_recibido"
              render={({ field: { onChange, value } }) => (
                <Input label="Monto recibido (₡)" value={value} onChangeText={onChange} keyboardType="numeric" />
              )} />
            <Controller control={control} name="notas"
              render={({ field: { onChange, value } }) => (
                <Input label="Notas (opcional)" value={value} onChangeText={onChange} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
              )} />
            {ventaSeleccionada && (
              <TouchableOpacity style={styles.btnEliminarModal} onPress={() => confirmarEliminar(ventaSeleccionada)}>
                <Text style={styles.btnEliminarModalText}>🗑 Eliminar esta venta</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!ventaAEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar venta</Text>
            <Text style={styles.confirmMensaje}>¿Eliminás la venta de {ventaAEliminar?.cliente_nombre}? Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setVentaAEliminar(null)}>
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
  btnPrimary: { backgroundColor: COLORS.wine, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnPrimaryText: { fontSize: 12, fontWeight: '600', color: COLORS.surface },
  mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF8F5', paddingHorizontal: SIZES.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(232,200,184,0.6)' },
  mesBtn: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', paddingHorizontal: 12, paddingVertical: 4 },
  mesBtnText: { fontSize: 18, color: COLORS.textPrimary },
  mesNombre: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  resumenBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECABA0', paddingHorizontal: SIZES.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E09080' },
  resumenText: { fontSize: 12, color: '#7A3030', fontWeight: '500' },
  resumenTotal: { fontSize: 15, fontWeight: '700', color: '#3D1010' },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg },
  ventaCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(232,200,184,0.5)', marginBottom: 10, overflow: 'hidden', shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  ventaMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECABA0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#622632' },
  ventaInfo: { flex: 1 },
  ventaNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  ventaDetalle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  canalBadge: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(98,38,50,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  canalText: { fontSize: 10, color: '#622632', fontWeight: '600' },
  ventaNota: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  ventaMonto: { alignItems: 'flex-end', gap: 4 },
  ventaMontoText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  pendienteBadge: { backgroundColor: '#FFF0EE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pendienteText: { fontSize: 10, color: COLORS.wine, fontWeight: '500' },
  ventaAcciones: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(232,200,184,0.5)' },
  btnEditar: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(232,200,184,0.5)' },
  btnEditarText: { fontSize: 12, color: COLORS.wine, fontWeight: '500' },
  btnEliminar: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  btnEliminarText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  emptyBtn: { backgroundColor: COLORS.wine, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8, shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyBtnText: { color: COLORS.surface, fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { backgroundColor: COLORS.surface, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(232,200,184,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalCancelar: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  modalTitulo: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  modalGuardar: { fontSize: 14, color: COLORS.wine, fontWeight: '600' },
  fieldLabel: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },
  canalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  canalChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', backgroundColor: 'white' },
  canalChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  canalChipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  canalChipTextActive: { color: COLORS.surface },
  entregaOptions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  entregaOpt: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', backgroundColor: 'white', gap: 4 },
  entregaOptActive: { borderColor: '#E09080', backgroundColor: '#ECABA0' },
  entregaEmoji: { fontSize: 20 },
  entregaLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary, textAlign: 'center' },
  btnEliminarModal: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', alignItems: 'center' },
  btnEliminarModalText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  confirmBox: { backgroundColor: '#FFF1ED', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  confirmTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  confirmMensaje: { fontSize: 13, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancelar: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(232,200,184,0.8)', alignItems: 'center' },
  confirmCancelarText: { color: COLORS.textPrimary, fontWeight: '500', fontSize: 14 },
  confirmEliminar: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: COLORS.wine, alignItems: 'center', shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  confirmEliminarText: { color: COLORS.surface, fontWeight: '600', fontSize: 14 },
});
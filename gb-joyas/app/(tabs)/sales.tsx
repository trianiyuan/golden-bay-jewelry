// app/(tabs)/sales.tsx — Boutique theme
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { getVentas, updateVenta, eliminarVenta, getCanalesVenta } from '../../lib/queries/sales';
import { Venta } from '../../types';
import { colors, fonts, typography, radius } from '../../constants/theme';
import { PageHeader } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
type FormEdit = { cliente_nombre: string; notas: string; total_recibido: string; };

// ─── Íconos SVG inline ────────────────────────────────────────
// (reemplazables por tu librería de íconos si tenés una)
const EditIcon = () => (
  <Text style={{ fontSize: 14, color: colors.muted }}>✎</Text>
);
const TrashIcon = () => (
  <Text style={{ fontSize: 14, color: colors.wine }}>⌫</Text>
);

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

  function totalProductosDistintos(venta: Venta): number {
    return (venta.productos || []).length;
  }

  function abrirEditar(venta: Venta) {
    setVentaSeleccionada(venta);
    setCanalEditando(venta.canal_venta_id || '');
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
        <TouchableOpacity style={styles.btnAdd} onPress={() => router.push('/sale/new')} activeOpacity={0.85}>
          <Text style={styles.btnAddText}>+ Agregar</Text>
        </TouchableOpacity>
      } />

      {/* ── Selector de mes ── */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MESES[mes.getMonth()]} {mes.getFullYear()}</Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Strip total vino ── */}
      {ventas.length > 0 && (
        <LinearGradient
          colors={['#6A2233', '#5A1B2B', '#3F1320']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryStrip}
        >
          <View style={styles.summaryFrame} pointerEvents="none" />
          <Text style={styles.summaryCount}>
            {ventas.length} venta{ventas.length > 1 ? 's' : ''} · {MESES[mes.getMonth()]}
          </Text>
          <Text style={styles.summaryTotal}>₡{totalMes.toLocaleString('es-CR')}</Text>
        </LinearGradient>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Lista de ventas ── */}
        {ventas.length > 0 && (
          <View style={styles.listCard}>
            {ventas.map((venta, i) => {
              const unidades = totalUnidades(venta);
              const distintos = totalProductosDistintos(venta);
              const tienePendiente = Number(venta.total_recibido) < Number(venta.total_cobrado);

              return (
                <View
                  key={venta.id}
                  style={[styles.ventaRow, i === ventas.length - 1 && { borderBottomWidth: 0 }]}
                >
                  {/* Avatar - Imagen del producto o iniciales */}
                    {venta.productos && venta.productos.length > 0 && venta.productos[0]?.producto?.imagen_url ? (
                      <Image
                        source={{ uri: venta.productos[0].producto.imagen_url }}
                        style={styles.avatar}
                      />
                    ) : (
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
                    )}

                  {/* Info */}
                  <TouchableOpacity style={styles.ventaMain} onPress={() => abrirEditar(venta)} activeOpacity={0.7}>
                    <Text style={styles.ventaNombre}>{venta.cliente_nombre}</Text>
                    <Text style={styles.ventaMeta} numberOfLines={1}>
                      {unidades} unidad{unidades !== 1 ? 'es' : ''} · {venta.metodo_entrega === 'correos_cr' ? 'Correos CR' : 'Retiro personal'} · {new Date(venta.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
                    </Text>

                    <View style={styles.ventaBadgesRow}>
                      {venta.canal_venta?.nombre && (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>{venta.canal_venta?.nombre}</Text>
                        </View>
                      )}
                      {tienePendiente && (
                        <View style={styles.chipPendiente}>
                          <Text style={styles.chipPendienteText}>Pendiente</Text>
                        </View>
                      )}
                    </View>

                    {venta.notas ? (
                      <Text style={styles.ventaNota} numberOfLines={1}>"{venta.notas}"</Text>
                    ) : null}

                    {venta.canal_venta?.comision_porcentaje > 0 && (
                      <Text style={styles.comisionText}>
                        Comisión: ₡{Math.round(Number(venta.total_cobrado) * (venta.canal_venta.comision_porcentaje / 100)).toLocaleString('es-CR')} ({venta.canal_venta.comision_porcentaje}%)
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Monto + acciones */}
                  <View style={styles.ventaRight}>
                    <Text style={styles.ventaMonto}>
                      ₡{Number(venta.total_cobrado).toLocaleString('es-CR')}
                    </Text>
                    <View style={styles.ventaActions}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => abrirEditar(venta)}>
                        <EditIcon />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => confirmarEliminar(venta)}>
                        <TrashIcon />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Estado vacío ── */}
        {ventas.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin ventas en {MESES[mes.getMonth()]}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/sale/new')}>
              <Text style={styles.emptyBtnText}>+ Registrar primera venta</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ════════════════════════════════════════════════════════
          MODAL EDITAR
      ════════════════════════════════════════════════════════ */}
      <Modal visible={modalEditar} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>

          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalEditar(false); setVentaSeleccionada(null); }}>
              <Text style={styles.modalCancelar}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Editar venta</Text>
            <TouchableOpacity onPress={handleSubmit(guardarEdicion)} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.wine} size="small" />
                : <Text style={styles.modalGuardar}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>

            {/* Productos vendidos (solo lectura) */}
            {ventaSeleccionada && (ventaSeleccionada.productos || []).length > 0 && (
              <View style={styles.productosCard}>
                <Text style={styles.productosTitle}>PRODUCTOS VENDIDOS</Text>
                {(ventaSeleccionada.productos || []).map((vp: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.productoRow,
                      i === (ventaSeleccionada.productos || []).length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.productoImg}>
                      {vp.producto?.imagen_url
                        ? <Image source={{ uri: vp.producto.imagen_url }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                        : <View style={styles.productoImgPlaceholder} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productoNombre}>{vp.producto?.nombre || 'Producto'}</Text>
                      <Text style={styles.productoMeta}>₡{(vp.precio_unitario || 0).toLocaleString('es-CR')} c/u</Text>
                    </View>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>×{vp.cantidad}</Text>
                    </View>
                    <Text style={styles.productoTotal}>
                      ₡{((vp.precio_unitario || 0) * vp.cantidad).toLocaleString('es-CR')}
                    </Text>
                  </View>
                ))}
                <View style={styles.productosTotalesRow}>
                  <Text style={styles.productosTotalesLabel}>
                    {totalUnidades(ventaSeleccionada)} unidades · {totalProductosDistintos(ventaSeleccionada)} productos
                  </Text>
                  <Text style={styles.productosTotalesMonto}>
                    ₡{(ventaSeleccionada.productos || [])
                      .reduce((s: number, vp: any) => s + vp.precio_unitario * vp.cantidad, 0)
                      .toLocaleString('es-CR')}
                  </Text>
                </View>
              </View>
            )}

            {/* Nombre cliente */}
            <Controller
              control={control}
              name="cliente_nombre"
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Nombre del cliente *" value={value} onChangeText={onChange} error={errors.cliente_nombre?.message} />
              )}
            />

            {/* Canal de venta */}
            <Text style={styles.fieldLabel}>CANAL DE VENTA</Text>
            <View style={styles.pillsRow}>
              {canales.map(canal => (
                <TouchableOpacity
                  key={canal.id}
                  style={[styles.pill, canalEditando === canal.id && styles.pillActive]}
                  onPress={() => setCanalEditando(canal.id)}
                >
                  <Text style={[styles.pillText, canalEditando === canal.id && styles.pillTextActive]}>
                    {canal.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Método de entrega */}
            <Text style={styles.fieldLabel}>MÉTODO DE ENTREGA</Text>
            <View style={styles.entregaRow}>
              {[
                { key: 'correos_cr', label: 'Correos CR' },
                { key: 'retiro_personal', label: 'Retiro personal' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.entregaOpt, metodoEditando === opt.key && styles.entregaOptActive]}
                  onPress={() => setMetodoEditando(opt.key as any)}
                >
                  <Text style={[styles.entregaLabel, metodoEditando === opt.key && styles.entregaLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monto recibido */}
            <Controller
              control={control}
              name="total_recibido"
              render={({ field: { onChange, value } }) => (
                <Input label="Monto recibido (₡)" value={value} onChangeText={onChange} keyboardType="numeric" />
              )}
            />

            {/* Notas */}
            <Controller
              control={control}
              name="notas"
              render={({ field: { onChange, value } }) => (
                <Input label="Notas (opcional)" value={value} onChangeText={onChange} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
              )}
            />

            {/* Eliminar */}
            {ventaSeleccionada && (
              <TouchableOpacity
                style={styles.btnEliminarModal}
                onPress={() => confirmarEliminar(ventaSeleccionada)}
              >
                <Text style={styles.btnEliminarModalText}>Eliminar esta venta</Text>
              </TouchableOpacity>
            )}

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          MODAL CONFIRMAR ELIMINAR
      ════════════════════════════════════════════════════════ */}
      <Modal visible={!!ventaAEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar venta</Text>
            <Text style={styles.confirmMensaje}>
              ¿Eliminás la venta de {ventaAEliminar?.cliente_nombre}? Esta acción no se puede deshacer.
            </Text>
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

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0E8DF' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  // ── Header ───────────────────────────────────────────────
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

  // ── Selector de mes ──────────────────────────────────────
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
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    color: colors.wine,
    lineHeight: 24,
  },
  monthLabel: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 19,
    color: colors.ink,
  },

  // ── Strip total vino ─────────────────────────────────────
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  summaryFrame: {
    position: 'absolute',
    top: 7, left: 7, right: 7, bottom: 7,
    borderWidth: 1,
    borderColor: 'rgba(226,196,154,0.26)',
    borderRadius: 8,
  },
  summaryCount: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.goldSoft,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  summaryTotal: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    color: '#FBEFE6',
  },

  // ── Card contenedor de lista ──────────────────────────────
  listCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    overflow: 'hidden',
  },

  // ── Fila de venta ─────────────────────────────────────────
  ventaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 42,
    height: 42,
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
  ventaMain: { flex: 1, minWidth: 0 },
  ventaNombre: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  ventaMeta: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },
  ventaBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  chip: {
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
  chipPendiente: {
    backgroundColor: colors.paper,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  chipPendienteText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ventaNota: {
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    color: colors.wine2,
    marginTop: 5,
  },
  comisionText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  ventaRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  ventaMonto: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  ventaActions: { flexDirection: 'row', gap: 7 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.iconBtn,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    borderColor: 'rgba(90,27,43,0.2)',
  },

  // ── Estado vacío ─────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.muted,
  },
  emptyBtn: {
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 13,
  },

  // ── Modal editar ─────────────────────────────────────────
  modal: { flex: 1, backgroundColor: colors.cream },
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
  modalCancelar: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.wine,
  },
  modalTitulo: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
  },
  modalGuardar: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.wine,
  },
  modalBody: { padding: 20, gap: 4, paddingBottom: 40 },

  // Productos vendidos
  productosCard: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 16,
  },
  productosTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  productoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  productoImg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  productoImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.coralBg,
    borderRadius: 8,
  },
  productoNombre: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  productoMeta: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  qtyBadge: {
    backgroundColor: colors.wine,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  qtyBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.paper,
  },
  productoTotal: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 14,
    color: colors.ink,
    minWidth: 60,
    textAlign: 'right',
  },
  productosTotalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  productosTotalesLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
  },
  productosTotalesMonto: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 16,
    color: colors.wine,
  },

  // Fields en modal
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  pillActive: {
    backgroundColor: colors.wine,
    borderColor: colors.wine,
  },
  pillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  pillTextActive: {
    color: colors.paper,
  },
  entregaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  entregaOpt: {
    flex: 1,
    borderRadius: radius.method,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  entregaOptActive: {
    borderColor: colors.gold,
    backgroundColor: colors.coralBg,
  },
  entregaLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  entregaLabelActive: {
    color: colors.wine,
  },
  btnEliminarModal: {
    marginTop: 24,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(90,27,43,0.2)',
    alignItems: 'center',
  },
  btnEliminarModalText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.wine,
  },

  // ── Confirm eliminar ─────────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,10,10,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  confirmTitulo: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
  },
  confirmMensaje: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
  },
  confirmCancelarText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.wine,
    fontSize: 14,
  },
  confirmEliminar: {
    flex: 1,
    padding: 14,
    borderRadius: radius.button,
    backgroundColor: colors.wine,
    alignItems: 'center',
  },
  confirmEliminarText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 14,
  },
});

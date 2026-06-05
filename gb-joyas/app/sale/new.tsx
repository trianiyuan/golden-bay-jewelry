// app/sale/new.tsx — Boutique theme
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { getProductos } from '../../lib/queries/products';
import { getCanalesVenta, registrarVenta } from '../../lib/queries/sales';
import { useCartStore } from '../../stores/cartStore';
import { Producto } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';

type FormData = {
  cliente_nombre: string;
  notas: string;
  costo_envio: string;
  total_recibido: string;
};

type Paso = 'productos' | 'cliente' | 'confirmar';

const PASO_TITLES: Record<Paso, string> = {
  productos: 'Productos',
  cliente:   'Cliente',
  confirmar: 'Confirmar',
};

export default function NewSaleScreen() {
  const router = useRouter();
  const { carrito, agregarProducto, cambiarCantidad, limpiarCarrito, total } = useCartStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [canales, setCanales] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [paso, setPaso] = useState<Paso>('productos');
  const [metodoEntrega, setMetodoEntrega] = useState<'correos_cr' | 'retiro_personal'>('correos_cr');
  const [canalSeleccionado, setCanalSeleccionado] = useState('');
  const [comisionCanal, setComisionCanal] = useState(0);
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { cliente_nombre: '', notas: '', costo_envio: '0', total_recibido: '' },
  });

  const costoEnvio  = parseFloat(watch('costo_envio') || '0') || 0;
  const subtotal    = total() + costoEnvio;
  const montoComision = comisionCanal > 0 ? Math.round(subtotal * (comisionCanal / 100)) : 0;
  const totalFinal  = subtotal + montoComision;

  useEffect(() => {
    getProductos().then(setProductos);
    getCanalesVenta().then(setCanales);
    return () => limpiarCarrito();
  }, []);

  const productosFiltrados = productos.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const canalError = submitted && !canalSeleccionado;

  function irPasoCliente() {
    if (carrito.length === 0) {
      Alert.alert('Sin productos', 'Agregá al menos un producto a la venta.');
      return;
    }
    setPaso('cliente');
  }

  function irConfirmar() {
    setSubmitted(true);
    if (!canalSeleccionado) return;
    setPaso('confirmar');
  }

  async function confirmarVenta(data: FormData) {
    try {
      setSaving(true);
      await registrarVenta({
        cliente_nombre: data.cliente_nombre.trim(),
        notas: data.notas.trim() || undefined,
        metodo_entrega: metodoEntrega,
        costo_envio: parseFloat(data.costo_envio) || 0,
        total_recibido: parseFloat(data.total_recibido) || totalFinal,
        carrito,
        canal_venta_id: canalSeleccionado,
        comision_porcentaje: comisionCanal || undefined,
        fecha: fechaVenta,
      });
      limpiarCarrito();
      router.dismissAll();
      setTimeout(() => router.replace('/(tabs)/sales'), 50);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        showBack
        backLabel={paso === 'productos' ? '✕ Cancelar' : '‹ Volver'}
        title={PASO_TITLES[paso]}
        rightElement={
          <View style={styles.pasos}>
            {(['productos', 'cliente', 'confirmar'] as Paso[]).map(p => (
              <View key={p} style={[styles.pasoDot, paso === p && styles.pasoDotActive]} />
            ))}
          </View>
        }
      />

      {/* ════ PASO 1: PRODUCTOS ════ */}
      {paso === 'productos' && (
        <>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>○</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto…"
              placeholderTextColor={colors.muted2}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {productosFiltrados.map(p => {
              const enCarrito = carrito.find(i => i.producto.id === p.id);
              return (
                <View key={p.id} style={styles.productoRow}>
                  {/* Imagen */}
                  <View style={styles.productoImg}>
                    {p.imagen_url
                      ? <Image source={{ uri: p.imagen_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      : <Text style={styles.productoImgGlyph}>◇</Text>
                    }
                  </View>

                  {/* Info */}
                  <View style={styles.productoInfo}>
                    <Text style={styles.productoNombre}>{p.nombre}</Text>
                    <Text style={styles.productoMeta}>
                      Talla {p.talla?.valor} · ₡{(p.precio_venta || 0).toLocaleString('es-CR')}
                    </Text>
                    <Text style={[styles.productoStock, p.cantidad < 3 && { color: colors.wine }]}>
                      {p.cantidad} {p.categoria?.unidad === 'par' ? 'pares' : 'unidades'} disponibles
                    </Text>
                  </View>

                  {/* Qty / Agregar */}
                  {enCarrito ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn}
                        onPress={() => cambiarCantidad(p.id, enCarrito.cantidad - 1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{enCarrito.cantidad}</Text>
                      <TouchableOpacity style={styles.qtyBtn}
                        onPress={() => enCarrito.cantidad < p.cantidad
                          ? cambiarCantidad(p.id, enCarrito.cantidad + 1)
                          : Alert.alert('Sin más stock')
                        }>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addBtn, p.cantidad === 0 && { opacity: 0.4 }]}
                      onPress={() => p.cantidad > 0 && agregarProducto(p)}
                      disabled={p.cantidad === 0}
                    >
                      <Text style={styles.addBtnText}>+ Agregar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {carrito.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.cartSummary}>
                <Text style={styles.cartCount}>
                  {carrito.length} producto{carrito.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.cartTotal}>₡{total().toLocaleString('es-CR')}</Text>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={irPasoCliente}>
                <Text style={styles.nextBtnText}>Continuar →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ════ PASO 2: CLIENTE ════ */}
      {paso === 'cliente' && (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Controller
              control={control} name="cliente_nombre"
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Nombre del cliente *" value={value} onChangeText={onChange}
                  placeholder="Ej. María Rodríguez" error={errors.cliente_nombre?.message} />
              )}
            />

            {/* Canal */}
            <Text style={styles.fieldLabel}>
              CANAL DE VENTA <Text style={{ color: colors.coral }}>*</Text>
            </Text>
            <View style={styles.pillsWrap}>
              {canales.map(canal => (
                <TouchableOpacity
                  key={canal.id}
                  style={[
                    styles.pill,
                    canalSeleccionado === canal.id && styles.pillActive,
                    canalError && styles.pillError,
                  ]}
                  onPress={() => {
                    setCanalSeleccionado(canal.id);
                    setComisionCanal(canal.comision_porcentaje || 0);
                  }}
                >
                  <Text style={[styles.pillText, canalSeleccionado === canal.id && styles.pillTextActive]}>
                    {canal.nombre}{canal.comision_porcentaje > 0 ? ` (${canal.comision_porcentaje}%)` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {canalError && <Text style={styles.errorMsg}>Seleccioná un canal de venta</Text>}

            {/* Notas */}
            <Controller
              control={control} name="notas"
              render={({ field: { onChange, value } }) => (
                <Input label="Notas (opcional)" value={value} onChangeText={onChange}
                  placeholder="Ej. comprado de regalo, pagado por Sinpe..."
                  multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
              )}
            />

            {/* Fecha */}
            <Text style={styles.fieldLabel}>FECHA DE LA VENTA</Text>
            <TextInput
              style={styles.fechaInput}
              value={fechaVenta}
              onChangeText={setFechaVenta}
              placeholder="2026-05-20"
              placeholderTextColor={colors.muted2}
            />
            <Text style={styles.fechaHint}>
              Formato: YYYY-MM-DD. Dejá la fecha de hoy si la venta es actual.
            </Text>

            {/* Método de entrega */}
            <Text style={styles.fieldLabel}>MÉTODO DE ENTREGA</Text>
            <View style={styles.entregaRow}>
              {[
                { key: 'correos_cr',      label: 'Correos CR' },
                { key: 'retiro_personal', label: 'Retiro personal' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.entregaOpt, metodoEntrega === opt.key && styles.entregaOptActive]}
                  onPress={() => setMetodoEntrega(opt.key as any)}
                >
                  <Text style={[styles.entregaLabel, metodoEntrega === opt.key && styles.entregaLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {metodoEntrega === 'correos_cr' && (
              <Controller
                control={control} name="costo_envio"
                render={({ field: { onChange, value } }) => (
                  <Input label="Costo de envío cobrado (₡)" value={value}
                    onChangeText={onChange} keyboardType="numeric" placeholder="0" />
                )}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextBtn} onPress={irConfirmar}>
              <Text style={styles.nextBtnText}>Ver resumen →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ════ PASO 3: CONFIRMAR ════ */}
      {paso === 'confirmar' && (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

            {/* Productos */}
            <Text style={styles.sectionTitle}>PRODUCTOS</Text>
            <View style={styles.resumenCard}>
              {carrito.map((item, i) => (
                <View key={item.producto.id}
                  style={[styles.resumenRow, i === carrito.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.resumenNombre}>{item.producto.nombre}</Text>
                  <Text style={styles.resumenQty}>×{item.cantidad}</Text>
                  <Text style={styles.resumenMonto}>
                    ₡{((item.producto.precio_venta || 0) * item.cantidad).toLocaleString('es-CR')}
                  </Text>
                </View>
              ))}
              {costoEnvio > 0 && (
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenNombre}>Envío</Text>
                  <Text style={styles.resumenQty}></Text>
                  <Text style={styles.resumenMonto}>₡{costoEnvio.toLocaleString('es-CR')}</Text>
                </View>
              )}
              {montoComision > 0 && (
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenNombre}>Comisión canal ({comisionCanal}%)</Text>
                  <Text style={styles.resumenQty}></Text>
                  <Text style={styles.resumenMonto}>₡{montoComision.toLocaleString('es-CR')}</Text>
                </View>
              )}
            </View>

            {/* Total */}
            <View style={styles.totalStrip}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalMonto}>₡{totalFinal.toLocaleString('es-CR')}</Text>
            </View>

            {/* Canal */}
            <View style={styles.canalConfirm}>
              <Text style={styles.canalConfirmLabel}>Canal</Text>
              <Text style={styles.canalConfirmValue}>
                {canales.find(c => c.id === canalSeleccionado)?.nombre || '—'}
              </Text>
            </View>

            {/* Monto recibido */}
            <Text style={[styles.fieldLabel, { marginTop: 16, color: colors.wine, fontSize: 12 }]}>MONTO RECIBIDO (₡)</Text>
            <Text style={styles.fechaHint}>
              Dejá vacío si recibiste el precio normal del producto. Cambialo si recibiste un monto diferente, por ejemplo: ventas pasadas sin detalle, precio inflado por plaza (Escazú, feria), o pagos combinados.
            </Text>
            <Text style={[styles.fechaHint, { color: colors.chipTiktokText, fontFamily: fonts.sansBold, marginTop: -8 }]}>
              ⚠️ Si llenás este campo, el monto que pongas reemplaza el precio original del producto en tus reportes de finanzas.
            </Text>
            <Controller
              control={control} name="total_recibido"
              render={({ field: { onChange, value } }) => (
                <Input
                  label=""
                  value={value || String(totalFinal)}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  placeholder={String(totalFinal)}
                />
              )}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit(confirmarVenta)}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.paper} />
                : <Text style={styles.nextBtnText}>Confirmar venta</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand },

  // ── Pasos ─────────────────────────────────────────────────
  pasos: { flexDirection: 'row', gap: 6 },
  pasoDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.coralSoft,
  },
  pasoDotActive: { backgroundColor: colors.wine },

  // ── Búsqueda ──────────────────────────────────────────────
  searchBar: {
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIcon:  { fontSize: 14, color: colors.muted2 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  searchClear: { fontSize: 14, color: colors.muted },

  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  // ── Fila de producto ──────────────────────────────────────
  productoRow: {
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productoImg: {
    width: 46, height: 46,
    borderRadius: 10,
    backgroundColor: '#F7E6E0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productoImgGlyph: { fontSize: 18, color: colors.muted, opacity: 0.4 },
  productoInfo:  { flex: 1 },
  productoNombre: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  productoMeta:  { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, marginTop: 2 },
  productoStock: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, marginTop: 1 },

  // Qty controls
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.cream,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.ink, lineHeight: 22 },
  qtyNum: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 18, color: colors.ink,
    minWidth: 22, textAlign: 'center',
  },

  // Botón agregar
  addBtn: {
    backgroundColor: colors.cream,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.wine,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    backgroundColor: colors.paper,
    padding: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cartSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cartCount:   { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
  cartTotal:   { fontFamily: fonts.serifSemiBold, fontSize: 20, color: colors.ink },
  nextBtn: {
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // ── Fields ────────────────────────────────────────────────
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },
  errorMsg: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.coral,
    marginBottom: 8,
    marginTop: -4,
  },

  // ── Pills de canal ────────────────────────────────────────
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  pillActive: { backgroundColor: colors.wine, borderColor: colors.wine },
  pillError:  { borderColor: colors.coral },
  pillText:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  pillTextActive: { color: colors.paper },

  // ── Fecha ─────────────────────────────────────────────────
  fechaInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.input,
    padding: 14,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 6,
  },
  fechaHint: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.wine,
    marginBottom: 14,
  },

  // ── Método de entrega ─────────────────────────────────────
  entregaRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
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
  entregaLabelActive: { color: colors.wine },

  // ── Resumen ───────────────────────────────────────────────
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  resumenCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: 4,
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  resumenNombre: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  resumenQty:    { fontFamily: fonts.sansRegular, fontSize: 13, color: colors.muted, marginRight: 12 },
  resumenMonto:  { fontFamily: fonts.serifSemiBold, fontSize: 16, color: colors.ink },

  // Total strip
  totalStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: colors.coralBg,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.coralSoft,
    marginBottom: 12,
  },
  totalLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.wine },
  totalMonto: { fontFamily: fonts.serifSemiBold, fontSize: 28, color: colors.wine },

  // Canal confirm
  canalConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  canalConfirmLabel: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  canalConfirmValue: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
});

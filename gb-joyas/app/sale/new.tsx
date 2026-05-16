// app/sale/new.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { getProductos, getCanalesVenta } from '../../lib/queries/products';
import { registrarVenta } from '../../lib/queries/sales';
import { useCartStore } from '../../stores/cartStore';
import { Producto } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';

type FormData = {
  cliente_nombre: string;
  notas: string;
  costo_envio: string;
  total_recibido: string;
};

type Paso = 'productos' | 'cliente' | 'confirmar';

export default function NewSaleScreen() {
  const router = useRouter();
  const { carrito, agregarProducto, cambiarCantidad, limpiarCarrito, total } = useCartStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [canales, setCanales] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [paso, setPaso] = useState<Paso>('productos');
  const [metodoEntrega, setMetodoEntrega] = useState<'correos_cr' | 'retiro_personal'>('correos_cr');
  const [canalSeleccionado, setCanalSeleccionado] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { cliente_nombre: '', notas: '', costo_envio: '0', total_recibido: '' },
  });

  const costoEnvio = parseFloat(watch('costo_envio') || '0') || 0;
  const totalFinal = total() + costoEnvio;

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
      });
      limpiarCarrito();
      // Fix redirect: dismissAll primero para cerrar el modal, luego navegar
      router.dismissAll();
      setTimeout(() => router.replace('/(tabs)/sales'), 50);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = { productos: 'Productos', cliente: 'Cliente', confirmar: 'Confirmar' };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        showBack
        backLabel={paso === 'productos' ? '✕ Cancelar' : '‹ Volver'}
        title={stepLabels[paso]}
        rightElement={
          <View style={styles.pasos}>
            {(['productos', 'cliente', 'confirmar'] as Paso[]).map(p => (
              <View key={p} style={[styles.pasoDot, paso === p && styles.pasoDotActive]} />
            ))}
          </View>
        }
      />

      {paso === 'productos' && (
        <>
          <View style={styles.searchBar}>
            <Text>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto..."
              placeholderTextColor={COLORS.textLight}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {productosFiltrados.map(p => {
              const enCarrito = carrito.find(i => i.producto.id === p.id);
              return (
                <View key={p.id} style={styles.productoItem}>
                  <View style={styles.productoImg}>
                    {p.imagen_url
                      ? <Image source={{ uri: p.imagen_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      : <Text style={{ fontSize: 20 }}>💍</Text>
                    }
                  </View>
                  <View style={styles.productoInfo}>
                    <Text style={styles.productoNombre}>{p.nombre}</Text>
                    <Text style={styles.productoMeta}>
                      Talla {p.talla?.valor} · ₡{(p.precio_venta || 0).toLocaleString('es-CR')}
                    </Text>
                    <Text style={[styles.productoStock, p.cantidad < 3 && { color: COLORS.wine }]}>
                      {p.cantidad} {p.categoria?.unidad === 'par' ? 'pares' : 'unidades'} disponibles
                    </Text>
                  </View>
                  {enCarrito ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => cambiarCantidad(p.id, enCarrito.cantidad - 1)}>
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
                <Text style={styles.cartCount}>{carrito.length} producto{carrito.length > 1 ? 's' : ''}</Text>
                <Text style={styles.cartTotal}>₡{total().toLocaleString('es-CR')}</Text>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={irPasoCliente}>
                <Text style={styles.nextBtnText}>Continuar →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

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

            <Text style={styles.fieldLabel}>
              CANAL DE VENTA <Text style={{ color: COLORS.error }}>*</Text>
            </Text>
            <View style={styles.canalesGrid}>
              {canales.map(canal => (
                <TouchableOpacity
                  key={canal.id}
                  style={[
                    styles.canalChip,
                    canalSeleccionado === canal.id && styles.canalChipActive,
                    canalError && styles.canalChipError,
                  ]}
                  onPress={() => setCanalSeleccionado(canal.id)}
                >
                  <Text style={[styles.canalText, canalSeleccionado === canal.id && styles.canalTextActive]}>
                    {canal.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {canalError && <Text style={styles.errorMsg}>Seleccioná un canal de venta</Text>}

            <Controller
              control={control} name="notas"
              render={({ field: { onChange, value } }) => (
                <Input label="Notas (opcional)" value={value} onChangeText={onChange}
                  placeholder="Ej. comprado de regalo, pagado por Sinpe..."
                  multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
              )}
            />

            <Text style={styles.fieldLabel}>MÉTODO DE ENTREGA</Text>
            <View style={styles.entregaOptions}>
              {[
                { key: 'correos_cr', label: 'Correos CR', emoji: '📬' },
                { key: 'retiro_personal', label: 'Retiro personal', emoji: '🤝' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.entregaOpt, metodoEntrega === opt.key && styles.entregaOptActive]}
                  onPress={() => setMetodoEntrega(opt.key as any)}
                >
                  <Text style={styles.entregaEmoji}>{opt.emoji}</Text>
                  <Text style={styles.entregaLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {metodoEntrega === 'correos_cr' && (
              <Controller
                control={control} name="costo_envio"
                render={({ field: { onChange, value } }) => (
                  <Input label="Costo de envío cobrado (₡)" value={value} onChangeText={onChange}
                    keyboardType="numeric" placeholder="0" />
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

      {paso === 'confirmar' && (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>PRODUCTOS</Text>
            {carrito.map(item => (
              <View key={item.producto.id} style={styles.resumenItem}>
                <Text style={styles.resumenNombre}>{item.producto.nombre}</Text>
                <Text style={styles.resumenDetalle}>×{item.cantidad}</Text>
                <Text style={styles.resumenMonto}>
                  ₡{((item.producto.precio_venta || 0) * item.cantidad).toLocaleString('es-CR')}
                </Text>
              </View>
            ))}
            {costoEnvio > 0 && (
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNombre}>Envío</Text>
                <Text style={styles.resumenDetalle}></Text>
                <Text style={styles.resumenMonto}>₡{costoEnvio.toLocaleString('es-CR')}</Text>
              </View>
            )}
            <View style={styles.resumenTotal}>
              <Text style={styles.resumenTotalLabel}>Total</Text>
              <Text style={styles.resumenTotalMonto}>₡{totalFinal.toLocaleString('es-CR')}</Text>
            </View>

            <View style={styles.channelConfirmar}>
              <Text style={styles.channelConfirmarLabel}>Canal:</Text>
              <Text style={styles.channelConfirmarValue}>
                {canales.find(c => c.id === canalSeleccionado)?.nombre || '—'}
              </Text>
            </View>

            <Controller
              control={control} name="total_recibido"
              render={({ field: { onChange, value } }) => (
                <Input label="Monto recibido (₡)" value={value || String(totalFinal)}
                  onChangeText={onChange} keyboardType="numeric"
                  placeholder={String(totalFinal)} containerStyle={{ marginTop: 16 }} />
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
                ? <ActivityIndicator color={COLORS.surface} />
                : <Text style={styles.nextBtnText}>✓ Confirmar venta</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  pasos: { flexDirection: 'row', gap: 5 },
  pasoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  pasoDotActive: { backgroundColor: COLORS.wine },
  searchBar: { backgroundColor: COLORS.surfaceAlt, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SIZES.lg, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary, padding: 0 },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg },
  productoItem: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  productoImg: { width: 46, height: 46, borderRadius: 8, backgroundColor: COLORS.blush, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  productoMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  productoStock: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 20 },
  qtyNum: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, minWidth: 20, textAlign: 'center' },
  addBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: SIZES.radiusSm, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  addBtnText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  footer: { backgroundColor: COLORS.surface, padding: 12, paddingHorizontal: SIZES.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  cartSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cartCount: { fontSize: 12, color: COLORS.textMuted },
  cartTotal: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  nextBtn: { backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd, paddingVertical: 13, alignItems: 'center' },
  nextBtnText: { color: COLORS.surface, fontSize: 14, fontWeight: '600' },
  fieldLabel: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 8 },
  errorMsg: { fontSize: 11, color: COLORS.error, marginBottom: 8, marginTop: -4 },
  canalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  canalChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  canalChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  canalChipError: { borderColor: COLORS.error },
  canalText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  canalTextActive: { color: COLORS.surface },
  entregaOptions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  entregaOpt: { flex: 1, borderRadius: SIZES.radiusMd, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, gap: 6 },
  entregaOptActive: { borderColor: COLORS.peach, backgroundColor: COLORS.blush },
  entregaEmoji: { fontSize: 22 },
  entregaLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary, textAlign: 'center' },
  sectionTitle: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  resumenItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  resumenNombre: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  resumenDetalle: { fontSize: 13, color: COLORS.textMuted, marginRight: 12 },
  resumenMonto: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  resumenTotal: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.blush, borderRadius: SIZES.radiusMd, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginTop: 4 },
  resumenTotalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  resumenTotalMonto: { fontSize: 17, fontWeight: '700', color: COLORS.wine },
  channelConfirmar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: SIZES.radiusMd, padding: 12, marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  channelConfirmarLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  channelConfirmarValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
});

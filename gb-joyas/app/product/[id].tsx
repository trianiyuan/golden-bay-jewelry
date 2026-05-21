// app/product/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Image, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  getProductoById, ajustarStock,
  updateProducto, uploadImagenProducto, getCategorias, getTallasPorCategoria,
} from '../../lib/queries/products';
import { Producto, Categoria, TallaPorCategoria } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';

const COLOR_LABELS: Record<string, string> = { dorado: 'Oro', plateado: 'Plata', rose_gold: 'Oro Rosa' };
const COLOR_DOTS: Record<string, string> = { dorado: '#D4AF37', plateado: '#C0C0C0', rose_gold: '#ECABA0' };
const COLORES = [
  { key: 'dorado', label: 'Oro', dot: '#D4AF37' },
  { key: 'plateado', label: 'Plata', dot: '#C0C0C0' },
  { key: 'rose_gold', label: 'Oro Rosa', dot: '#ECABA0' },
];
const TIPOS_ARETE = [
  { key: 'regular', label: 'Regular' },
  { key: 'ear_cuff', label: 'Ear Cuff' },
];

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [ajustando, setAjustando] = useState(false);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalEliminarConVentas, setModalEliminarConVentas] = useState(false);
  const [modalArchivar, setModalArchivar] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tallas, setTallas] = useState<TallaPorCategoria[]>([]);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecioVenta, setEditPrecioVenta] = useState('');
  const [editPrecioCosto, setEditPrecioCosto] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editTalla, setEditTalla] = useState('');
  const [editColor, setEditColor] = useState('dorado');
  const [editTipoArete, setEditTipoArete] = useState<'regular' | 'ear_cuff' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargar(); getCategorias().then(setCategorias); }, [id]);

  useEffect(() => {
    if (editCat) getTallasPorCategoria(editCat).then(setTallas);
  }, [editCat]);

  const categoriaActiva = categorias.find(c => c.id === editCat);
  const esAretes = categoriaActiva?.nombre === 'Aretes';

  async function cargar() {
    try {
      const p = await getProductoById(id);
      setProducto(p);
      setEditNombre(p.nombre);
      setEditPrecioVenta(String(p.precio_venta || (p as any).precio || ''));
      setEditPrecioCosto(String(p.precio_costo || ''));
      setEditDescripcion(p.descripcion || '');
      setEditCat(p.categoria_id);
      setEditTalla(p.talla_id);
      setEditColor(p.color);
      setEditTipoArete(p.tipo_arete || null);
      const { data } = await supabase
        .from('movimientos_inventario')
        .select('*')
        .eq('producto_id', id)
        .order('created_at', { ascending: false })
        .limit(5);
      setMovimientos(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarStock(delta: number) {
    if (!producto) return;
    if (producto.cantidad + delta < 0) {
      Alert.alert('Aviso', 'No se puede reducir el stock por debajo de 0.');
      return;
    }
    try {
      setAjustando(true);
      await ajustarStock(producto.id, delta, delta > 0 ? 'Ajuste manual +' : 'Ajuste manual −');
      setProducto(prev => prev ? { ...prev, cantidad: prev.cantidad + delta } : prev);
      await cargar();
    } catch (e: any) {
      Alert.alert('Aviso', e.message || 'Error al ajustar stock.');
    } finally {
      setAjustando(false);
    }
  }

  async function cambiarImagen() {
    if (!producto) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;
    try {
      const url = await uploadImagenProducto(producto.id, result.assets[0].uri);
      await updateProducto(producto.id, { imagen_url: url });
      setProducto(prev => prev ? { ...prev, imagen_url: url } : prev);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo actualizar la foto.');
    }
  }

  async function guardarEdicion() {
    if (!producto || !editNombre || !editPrecioVenta || !editPrecioCosto) {
      Alert.alert('Campos obligatorios', 'Por favor completá todos los campos obligatorios.');
      return;
    }
    if (esAretes && !editTipoArete) {
      Alert.alert('Campo requerido', 'Seleccioná el tipo de arete.');
      return;
    }
    try {
      setSaving(true);
      await updateProducto(producto.id, {
        nombre: editNombre.trim(),
        precio_venta: parseFloat(editPrecioVenta),
        precio_costo: parseFloat(editPrecioCosto),
        descripcion: editDescripcion.trim() || undefined,
        categoria_id: editCat,
        talla_id: editTalla,
        color: editColor,
        tipo_arete: esAretes ? editTipoArete ?? undefined : undefined,
      } as any);
      await cargar();
      setEditMode(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function ejecutarEliminar() {
    try {
      const { data: ventasAsociadas } = await supabase
        .from('ventas_productos')
        .select('id')
        .eq('producto_id', producto!.id)
        .limit(1);

      if (ventasAsociadas && ventasAsociadas.length > 0) {
        setModalEliminar(false);
        setModalEliminarConVentas(true);
      } else {
        await supabase.from('movimientos_inventario').delete().eq('producto_id', producto!.id);
        const { error } = await supabase.from('productos').delete().eq('id', producto!.id);
        if (error) throw error;
        setModalEliminar(false);
        router.replace('/(tabs)/inventory');
      }
    } catch (e: any) {
      setModalEliminar(false);
      Alert.alert('Error', e.message || 'No se pudo eliminar el producto.');
    }
  }

  async function ejecutarArchivar() {
    try {
      await updateProducto(producto!.id, { activo: false });
      setModalArchivar(false);
      router.replace('/(tabs)/inventory');
    } catch (e: any) {
      setModalArchivar(false);
      Alert.alert('Error', e.message || 'No se pudo archivar el producto.');
    }
  }

  async function ejecutarEliminarConVentas() {
    try {
      await supabase.from('movimientos_inventario').delete().eq('producto_id', producto!.id);
      await supabase.from('ventas_productos').delete().eq('producto_id', producto!.id);
      const { error } = await supabase.from('productos').delete().eq('id', producto!.id);
      if (error) throw error;
      setModalEliminarConVentas(false);
      router.replace('/(tabs)/inventory');
    } catch (e: any) {
      setModalEliminarConVentas(false);
      Alert.alert('Error', e.message || 'No se pudo eliminar el producto.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.wine} />
      </SafeAreaView>
    );
  }

  if (!producto) return null;
  const stockBajo = producto.cantidad < 3;

  if (editMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header showBack backLabel="‹ Cancelar" title="Editar Producto"
          rightElement={
            <TouchableOpacity onPress={guardarEdicion} disabled={saving}>
              {saving
                ? <ActivityIndicator color={COLORS.wine} size="small" />
                : <Text style={{ color: COLORS.wine, fontWeight: '600', fontSize: 14 }}>Guardar</Text>
              }
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.imageContainer} onPress={cambiarImagen} activeOpacity={0.9}>
            {producto.imagen_url
              ? <Image source={{ uri: producto.imagen_url }} style={styles.image} resizeMode="cover" />
              : <View style={styles.imagePlaceholder}><Text style={{ fontSize: 40 }}>💍</Text></View>
            }
            <View style={styles.imageOverlay}><Text style={styles.imageOverlayText}>📷 Cambiar foto</Text></View>
          </TouchableOpacity>

          <Input label="Nombre del producto *" value={editNombre} onChangeText={setEditNombre} placeholder="Nombre" />
          <Input label="Precio de venta (₡) *" value={editPrecioVenta} onChangeText={setEditPrecioVenta} keyboardType="numeric" placeholder="18000" />
          <Input label="Precio de costo (₡) *" value={editPrecioCosto} onChangeText={setEditPrecioCosto} keyboardType="numeric" placeholder="5000" />
          <Input label="Descripción (opcional)" value={editDescripcion} onChangeText={setEditDescripcion} placeholder="Detalles..." multiline style={{ height: 70, textAlignVertical: 'top' }} />

          <Text style={styles.fieldLabel}>CATEGORÍA *</Text>
          <View style={styles.chipsRow}>
            {categorias.map(cat => (
              <TouchableOpacity key={cat.id}
                style={[styles.chip, editCat === cat.id && styles.chipActive]}
                onPress={() => { setEditCat(cat.id); setEditTipoArete(null); }}>
                <Text style={[styles.chipText, editCat === cat.id && styles.chipTextActive]}>{cat.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tallas.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>TALLA *</Text>
              <View style={styles.tallasGrid}>
                {tallas.map(t => (
                  <TouchableOpacity key={t.id}
                    style={[styles.tallaChip, editTalla === t.id && styles.tallaChipActive]}
                    onPress={() => setEditTalla(t.id)}>
                    <Text style={[styles.tallaText, editTalla === t.id && styles.tallaTextActive]}>{t.valor}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {esAretes && (
            <>
              <Text style={styles.fieldLabel}>TIPO DE ARETE *</Text>
              <View style={styles.chipsRow}>
                {TIPOS_ARETE.map(t => (
                  <TouchableOpacity key={t.key}
                    style={[styles.chip, editTipoArete === t.key && styles.chipActive]}
                    onPress={() => setEditTipoArete(t.key as 'regular' | 'ear_cuff')}>
                    <Text style={[styles.chipText, editTipoArete === t.key && styles.chipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>COLOR *</Text>
          <View style={styles.chipsRow}>
            {COLORES.map(c => (
              <TouchableOpacity key={c.key}
                style={[styles.chip, editColor === c.key && styles.chipActive]}
                onPress={() => setEditColor(c.key)}>
                <View style={[styles.colorDot, { backgroundColor: c.dot }]} />
                <Text style={[styles.chipText, editColor === c.key && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.archiveBtn} onPress={() => setModalArchivar(true)}>
            <Text style={styles.archiveBtnText}>📦 Archivar producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.archiveBtn, { marginTop: 8, borderColor: 'rgba(192,57,43,0.3)' }]} onPress={() => setModalEliminar(true)}>
            <Text style={[styles.archiveBtnText, { color: COLORS.error }]}>🗑 Eliminar producto</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>

        <Modal visible={modalArchivar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Archivar producto</Text>
            <Text style={styles.confirmMensaje}>"{producto?.nombre}" se ocultará del inventario pero sus ventas se mantendrán en los reportes.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalArchivar(false)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarArchivar}>
                <Text style={styles.confirmEliminarText}>Archivar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar producto</Text>
            <Text style={styles.confirmMensaje}>¿Eliminás "{producto?.nombre}"? Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalEliminar(false)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarEliminar}>
                <Text style={styles.confirmEliminarText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        <Modal visible={modalEliminarConVentas} animationType="fade" transparent>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitulo}>Este producto tiene ventas</Text>
              <Text style={styles.confirmMensaje}>"{producto?.nombre}" tiene ventas registradas. Si lo eliminás, los totales de tus reportes no se verán afectados, pero el detalle de esas ventas perderá la referencia al producto.</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalEliminarConVentas(false)}>
                  <Text style={styles.confirmCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarEliminarConVentas}>
                  <Text style={styles.confirmEliminarText}>Eliminar igual</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack backLabel="‹ Volver" title={producto.nombre}
        rightElement={
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.imageContainer} onPress={cambiarImagen} activeOpacity={0.9}>
          {producto.imagen_url
            ? <Image source={{ uri: producto.imagen_url }} style={styles.image} resizeMode="cover" />
            : <View style={styles.imagePlaceholder}>
                <Text style={{ fontSize: 52 }}>💍</Text>
                <Text style={styles.imagePlaceholderText}>Tocá para agregar foto</Text>
              </View>
          }
          <View style={styles.imageOverlay}><Text style={styles.imageOverlayText}>📷 Cambiar foto</Text></View>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.productoNombre}>{producto.nombre}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.colorDotLg, { backgroundColor: COLOR_DOTS[producto.color] }]} />
            <Text style={styles.metaText}>{COLOR_LABELS[producto.color]} · Talla {producto.talla?.valor}</Text>
            <View style={styles.categoriaBadge}>
              <Text style={styles.categoriaText}>{producto.categoria?.nombre}</Text>
            </View>
            {producto.tipo_arete && (
              <View style={[styles.categoriaBadge, { marginLeft: 4 }]}>
                <Text style={styles.categoriaText}>{producto.tipo_arete === 'regular' ? 'Regular' : 'Ear Cuff'}</Text>
              </View>
            )}
          </View>
          {producto.descripcion ? <Text style={styles.descripcion}>{producto.descripcion}</Text> : null}

          <View style={styles.pricesRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>PRECIO VENTA</Text>
              <Text style={styles.priceValue}>₡{(producto.precio_venta || (producto as any).precio || 0).toLocaleString('es-CR')}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>PRECIO COSTO</Text>
              <Text style={styles.priceValue}>₡{(producto.precio_costo || 0).toLocaleString('es-CR')}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>MARGEN</Text>
              <Text style={[styles.priceValue, { color: COLORS.wine }]}>
                ₡{((producto.precio_venta || (producto as any).precio || 0) - (producto.precio_costo || 0)).toLocaleString('es-CR')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stockCard}>
          <Text style={styles.stockTitle}>STOCK ACTUAL</Text>
          <View style={styles.stockControls}>
            <TouchableOpacity
              style={[styles.stockBtn, producto.cantidad === 0 && { opacity: 0.4 }]}
              onPress={() => cambiarStock(-1)}
              disabled={ajustando || producto.cantidad === 0}
            >
              <Text style={styles.stockBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stockDisplay}>
              {ajustando
                ? <ActivityIndicator color={COLORS.wine} />
                : <>
                    <Text style={[styles.stockNumber, stockBajo && { color: COLORS.wine }]}>
                      {producto.cantidad}
                    </Text>
                    <Text style={styles.stockUnidad}>
                      {producto.categoria?.unidad === 'par' ? 'pares' : 'unidades'}
                    </Text>
                  </>
              }
            </View>
            <TouchableOpacity style={styles.stockBtn} onPress={() => cambiarStock(1)} disabled={ajustando}>
              <Text style={styles.stockBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {stockBajo && (
            <View style={styles.stockAlerta}>
              <Text style={styles.stockAlertaText}>⚠️ Stock bajo — menos de 3 unidades</Text>
            </View>
          )}
        </View>

        {movimientos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MOVIMIENTOS RECIENTES</Text>
            {movimientos.map(m => (
              <View key={m.id} style={styles.movimientoItem}>
                <View style={[styles.movimientoIcon,
                  { backgroundColor: m.tipo === 'entrada' ? '#EAF3DE' : m.tipo === 'salida' ? COLORS.rose : COLORS.surfaceAlt }]}>
                  <Text style={{ fontSize: 14 }}>
                    {m.tipo === 'entrada' ? '↑' : m.tipo === 'salida' ? '↓' : '↔'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movimientoMotivo}>{m.motivo}</Text>
                  <Text style={styles.movimientoFecha}>
                    {new Date(m.created_at).toLocaleDateString('es-CR')}
                  </Text>
                </View>
                <Text style={[styles.movimientoCantidad, { color: m.cantidad > 0 ? '#3B6D11' : COLORS.wine }]}>
                  {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                </Text>
              </View>
            ))}
          </>
        )}
        <TouchableOpacity style={styles.archiveBtn} onPress={() => setModalArchivar(true)}>
          <Text style={styles.archiveBtnText}>📦 Archivar producto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.archiveBtn, { marginTop: 8, borderColor: 'rgba(192,57,43,0.3)' }]} onPress={() => setModalEliminar(true)}>
          <Text style={[styles.archiveBtnText, { color: COLORS.error }]}>🗑 Eliminar producto</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modalArchivar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Archivar producto</Text>
            <Text style={styles.confirmMensaje}>"{producto?.nombre}" se ocultará del inventario pero sus ventas se mantendrán en los reportes.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalArchivar(false)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarArchivar}>
                <Text style={styles.confirmEliminarText}>Archivar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEliminar} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Eliminar producto</Text>
            <Text style={styles.confirmMensaje}>¿Eliminás "{producto?.nombre}"? Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalEliminar(false)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarEliminar}>
                <Text style={styles.confirmEliminarText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEliminarConVentas} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Este producto tiene ventas</Text>
            <Text style={styles.confirmMensaje}>"{producto?.nombre}" tiene ventas registradas. Si lo eliminás, los totales de tus reportes no se verán afectados, pero el detalle de esas ventas perderá la referencia al producto.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelar} onPress={() => setModalEliminarConVentas(false)}>
                <Text style={styles.confirmCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmEliminar} onPress={ejecutarEliminarConVentas}>
                <Text style={styles.confirmEliminarText}>Eliminar igual</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg },
  editBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: SIZES.radiusSm, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.wine },
  imageContainer: { width: '100%', aspectRatio: 1.5, borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: COLORS.blush, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: COLORS.textMuted },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.25)', padding: 8, alignItems: 'center' },
  imageOverlayText: { fontSize: 12, color: 'white', fontWeight: '500' },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  productoNombre: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  colorDotLg: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  metaText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  categoriaBadge: { backgroundColor: COLORS.surfaceAlt, borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  categoriaText: { fontSize: 11, color: COLORS.textPrimary, fontWeight: '500' },
  descripcion: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 18 },
  pricesRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 3 },
  priceValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  stockCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  stockTitle: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 16, textAlign: 'center' },
  stockControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stockBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stockBtnText: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '300' },
  stockDisplay: { alignItems: 'center', minWidth: 80 },
  stockNumber: { fontSize: 40, fontWeight: '600', color: COLORS.textPrimary },
  stockUnidad: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  stockAlerta: { backgroundColor: COLORS.rose, borderRadius: SIZES.radiusSm, padding: 10, marginTop: 12, alignItems: 'center' },
  stockAlertaText: { fontSize: 12, color: COLORS.wine, fontWeight: '500' },
  sectionTitle: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  movimientoItem: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  movimientoIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  movimientoMotivo: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  movimientoFecha: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  movimientoCantidad: { fontSize: 15, fontWeight: '600' },
  archiveBtn: { marginTop: 24, padding: 14, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  archiveBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  fieldLabel: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  chipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  tallasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tallaChip: { width: 52, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  tallaChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  tallaText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  tallaTextActive: { color: COLORS.surface },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  confirmBox: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 24 },
  confirmTitulo: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  confirmMensaje: { fontSize: 13, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancelar: { flex: 1, padding: 12, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  confirmCancelarText: { color: COLORS.textPrimary, fontWeight: '500', fontSize: 14 },
  confirmEliminar: { flex: 1, padding: 12, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.wine, alignItems: 'center' },
  confirmEliminarText: { color: COLORS.surface, fontWeight: '600', fontSize: 14 },
});
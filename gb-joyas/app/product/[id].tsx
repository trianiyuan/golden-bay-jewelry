// app/product/[id].tsx — Boutique theme
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Image, ActivityIndicator, Modal, useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  getProductoById, ajustarStock,
  updateProducto, uploadImagenProducto, getCategorias, getTallasPorCategoria,
} from '../../lib/queries/products';
import { Producto, Categoria, TallaPorCategoria } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';
import { Header } from '../../components/ui/Header';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';

const COLOR_LABELS: Record<string, string> = { dorado: 'Oro', plateado: 'Plata', rose_gold: 'Oro Rosa' };
const COLOR_DOTS:  Record<string, string> = { dorado: '#C9A24A', plateado: '#C4C4CA', rose_gold: '#E0A091' };
const COLORES = [
  { key: 'dorado',    label: 'Oro',      dot: '#C9A24A' },
  { key: 'plateado',  label: 'Plata',    dot: '#C4C4CA' },
  { key: 'rose_gold', label: 'Oro Rosa', dot: '#E0A091' },
];
const TIPOS_ARETE = [
  { key: 'regular',  label: 'Regular'  },
  { key: 'ear_cuff', label: 'Ear Cuff' },
];

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

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
  useEffect(() => { if (editCat) getTallasPorCategoria(editCat).then(setTallas); }, [editCat]);

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
    } finally { setLoading(false); }
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
    } finally { setAjustando(false); }
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
    } catch {
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
    } finally { setSaving(false); }
  }

  async function ejecutarEliminar() {
    try {
      const { data: ventasAsociadas } = await supabase
        .from('ventas_productos').select('id').eq('producto_id', producto!.id).limit(1);
      if (ventasAsociadas && ventasAsociadas.length > 0) {
        setModalEliminar(false); setModalEliminarConVentas(true);
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

  // ── Modales compartidos ───────────────────────────────────
  const Modales = () => (
    <>
      {[
        { visible: modalArchivar, setVisible: setModalArchivar, titulo: 'Archivar producto',
          mensaje: `"${producto?.nombre}" se ocultará del inventario pero sus ventas se mantendrán en los reportes.`,
          accion: ejecutarArchivar, label: 'Archivar' },
        { visible: modalEliminar, setVisible: setModalEliminar, titulo: 'Eliminar producto',
          mensaje: `¿Eliminás "${producto?.nombre}"? Esta acción no se puede deshacer.`,
          accion: ejecutarEliminar, label: 'Eliminar' },
        { visible: modalEliminarConVentas, setVisible: setModalEliminarConVentas, titulo: 'Este producto tiene ventas',
          mensaje: `"${producto?.nombre}" tiene ventas registradas. Si lo eliminás, el detalle de esas ventas perderá la referencia al producto.`,
          accion: ejecutarEliminarConVentas, label: 'Eliminar igual' },
      ].map(({ visible, setVisible, titulo, mensaje, accion, label }) => (
        <Modal key={titulo} visible={visible} animationType="fade" transparent>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitulo}>{titulo}</Text>
              <Text style={styles.confirmMensaje}>{mensaje}</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.confirmCancelar} onPress={() => setVisible(false)}>
                  <Text style={styles.confirmCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmEliminar} onPress={accion}>
                  <Text style={styles.confirmEliminarText}>{label}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ))}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.wine} />
      </SafeAreaView>
    );
  }

  if (!producto) return null;
  const stockBajo = producto.cantidad < 3;

  // ── Modo edición ──────────────────────────────────────────
  if (editMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header
          showBack backLabel="‹ Cancelar" title="Editar producto"
          rightElement={
            <TouchableOpacity onPress={guardarEdicion} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.wine} size="small" />
                : <Text style={styles.saveLink}>Guardar</Text>
              }
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.imgContainer} onPress={cambiarImagen} activeOpacity={0.9}>
            {producto.imagen_url
              ? <Image source={{ uri: producto.imagen_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <View style={styles.imgPlaceholder}><Text style={styles.imgPlaceholderGlyph}>◇</Text></View>
            }
            <View style={styles.imgOverlay}><Text style={styles.imgOverlayText}>Cambiar foto</Text></View>
          </TouchableOpacity>

          <Input label="Nombre del producto *" value={editNombre} onChangeText={setEditNombre} placeholder="Nombre" />
          <Input label="Precio de venta (₡) *" value={editPrecioVenta} onChangeText={setEditPrecioVenta} keyboardType="numeric" placeholder="18 000" />
          <Input label="Precio de costo (₡) *" value={editPrecioCosto} onChangeText={setEditPrecioCosto} keyboardType="numeric" placeholder="5 000" />
          <Input label="Descripción (opcional)" value={editDescripcion} onChangeText={setEditDescripcion}
            placeholder="Detalles..." multiline style={{ height: 70, textAlignVertical: 'top' }} />

          <Text style={styles.fieldLabel}>CATEGORÍA *</Text>
          <View style={styles.pillsRow}>
            {categorias.map(cat => (
              <TouchableOpacity key={cat.id}
                style={[styles.pill, editCat === cat.id && styles.pillActive]}
                onPress={() => { setEditCat(cat.id); setEditTipoArete(null); }}>
                <Text style={[styles.pillText, editCat === cat.id && styles.pillTextActive]}>{cat.nombre}</Text>
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
              <View style={styles.pillsRow}>
                {TIPOS_ARETE.map(t => (
                  <TouchableOpacity key={t.key}
                    style={[styles.pill, editTipoArete === t.key && styles.pillActive]}
                    onPress={() => setEditTipoArete(t.key as 'regular' | 'ear_cuff')}>
                    <Text style={[styles.pillText, editTipoArete === t.key && styles.pillTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>COLOR *</Text>
          <View style={styles.pillsRow}>
            {COLORES.map(c => (
              <TouchableOpacity key={c.key}
                style={[styles.pill, editColor === c.key && styles.pillActive]}
                onPress={() => setEditColor(c.key)}>
                <View style={[styles.colorDot, { backgroundColor: c.dot }]} />
                <Text style={[styles.pillText, editColor === c.key && styles.pillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={() => setModalArchivar(true)}>
            <Text style={styles.dangerBtnText}>Archivar producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerBtn, { marginTop: 8, borderColor: colors.goldLine }]} onPress={() => setModalEliminar(true)}>
            <Text style={[styles.dangerBtnText, { color: colors.coral }]}>Eliminar producto</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
        <Modales />
      </SafeAreaView>
    );
  }

  // ── Vista de detalle ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <Header
        showBack backLabel="‹ Volver" title={producto.nombre}
        rightElement={
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {isDesktop ? (
          <View style={styles.desktopRow}>
            <TouchableOpacity style={styles.desktopImg} onPress={cambiarImagen} activeOpacity={0.9}>
              {producto.imagen_url
                ? <Image source={{ uri: producto.imagen_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                : <View style={styles.imgPlaceholder}><Text style={styles.imgPlaceholderGlyph}>◇</Text></View>
              }
              <View style={styles.imgOverlay}><Text style={styles.imgOverlayText}>Cambiar foto</Text></View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <InfoCard producto={producto} />
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.imgContainer} onPress={cambiarImagen} activeOpacity={0.9}>
              {producto.imagen_url
                ? <Image source={{ uri: producto.imagen_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                : <View style={styles.imgPlaceholder}>
                    <Text style={styles.imgPlaceholderGlyph}>◇</Text>
                    <Text style={styles.imgPlaceholderHint}>Tocá para agregar foto</Text>
                  </View>
              }
              <View style={styles.imgOverlay}><Text style={styles.imgOverlayText}>Cambiar foto</Text></View>
            </TouchableOpacity>
            <InfoCard producto={producto} />
          </>
        )}

        {/* Stock */}
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
                ? <ActivityIndicator color={colors.wine} />
                : <>
                    <Text style={[styles.stockNumber, stockBajo && { color: colors.wine }]}>
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
              <Text style={styles.stockAlertaText}>Stock bajo — menos de 3 unidades</Text>
            </View>
          )}
        </View>

        {/* Movimientos */}
        {movimientos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MOVIMIENTOS RECIENTES</Text>
            {movimientos.map(m => (
              <View key={m.id} style={styles.movRow}>
                <View style={[styles.movIcon,
                  { backgroundColor: m.tipo === 'entrada' ? '#EAF3DE' : m.tipo === 'salida' ? colors.coralBg : colors.cream }]}>
                  <Text style={{ fontSize: 14, color: m.tipo === 'entrada' ? '#3B6D11' : colors.wine }}>
                    {m.tipo === 'entrada' ? '↑' : m.tipo === 'salida' ? '↓' : '↔'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movMotivo}>{m.motivo}</Text>
                  <Text style={styles.movFecha}>{new Date(m.created_at).toLocaleDateString('es-CR')}</Text>
                </View>
                <Text style={[styles.movCantidad, { color: m.cantidad > 0 ? '#3B6D11' : colors.wine }]}>
                  {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                </Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity style={styles.dangerBtn} onPress={() => setModalArchivar(true)}>
          <Text style={styles.dangerBtnText}>Archivar producto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dangerBtn, { marginTop: 8, borderColor: 'rgba(192,57,43,0.3)' }]} onPress={() => setModalEliminar(true)}>
          <Text style={[styles.dangerBtnText, { color: colors.coral }]}>Eliminar producto</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
      <Modales />
    </SafeAreaView>
  );
}

// ── InfoCard (info básica del producto) ───────────────────────
function InfoCard({ producto }: { producto: Producto }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.productoNombre}>{producto.nombre}</Text>
      <View style={styles.metaRow}>
        <View style={[styles.colorDotLg, { backgroundColor: COLOR_DOTS[producto.color] || colors.muted2 }]} />
        <Text style={styles.metaText}>{COLOR_LABELS[producto.color]} · Talla {producto.talla?.valor}</Text>
        <View style={styles.categoriaBadge}>
          <Text style={styles.categoriaText}>{producto.categoria?.nombre}</Text>
        </View>
        {producto.tipo_arete && (
          <View style={[styles.categoriaBadge, { marginLeft: 4 }]}>
            <Text style={styles.categoriaText}>
              {producto.tipo_arete === 'regular' ? 'Regular' : 'Ear Cuff'}
            </Text>
          </View>
        )}
      </View>
      {producto.descripcion ? <Text style={styles.descripcion}>{producto.descripcion}</Text> : null}
      <View style={styles.pricesRow}>
        {[
          { label: 'PRECIO VENTA', value: producto.precio_venta || (producto as any).precio || 0, wine: false },
          { label: 'PRECIO COSTO', value: producto.precio_costo || 0, wine: false },
          { label: 'MARGEN', value: (producto.precio_venta || (producto as any).precio || 0) - (producto.precio_costo || 0), wine: true },
        ].map(({ label, value, wine }) => (
          <View key={label} style={styles.priceItem}>
            <Text style={styles.priceLabel}>{label}</Text>
            <Text style={[styles.priceValue, wine && { color: colors.wine }]}>
              ₡{value.toLocaleString('es-CR')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.sand },
  scroll:  { flex: 1 },
  content: { padding: 20 },

  // ── Links header ──────────────────────────────────────────
  saveLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.wine,
  },
  editBtn: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  editBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.wine,
  },

  // Desktop
  desktopRow: { flexDirection: 'row', gap: 24, marginBottom: 16, alignItems: 'flex-start' },
  desktopImg: { width: '35%', aspectRatio: 1, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },

  // ── Imagen ────────────────────────────────────────────────
  imgContainer: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  imgPlaceholder: {
    flex: 1,
    backgroundColor: '#F7E6E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imgPlaceholderGlyph: { fontSize: 32, color: colors.muted, opacity: 0.4 },
  imgPlaceholderHint: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
  imgOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(90,27,43,0.45)',
    padding: 8,
    alignItems: 'center',
  },
  imgOverlayText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.paper },

  // ── Info card ─────────────────────────────────────────────
  infoCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  productoNombre: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  colorDotLg: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  metaText: { fontFamily: fonts.sansRegular, fontSize: 13, color: colors.muted, flex: 1 },
  categoriaBadge: {
    backgroundColor: colors.paper,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoriaText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink },
  descripcion: { fontFamily: fonts.sansRegular, fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 18 },
  pricesRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.muted, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  priceValue: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.ink },

  // ── Stock ─────────────────────────────────────────────────
  stockCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  stockTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 18,
    textAlign: 'center',
  },
  stockControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  stockBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  stockBtnText: { fontFamily: fonts.serifSemiBold, fontSize: 24, color: colors.ink },
  stockDisplay: { alignItems: 'center', minWidth: 80 },
  stockNumber: { fontFamily: fonts.serifSemiBold, fontSize: 48, color: colors.ink, lineHeight: 52 },
  stockUnidad: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.muted, marginTop: 2 },
  stockAlerta: {
    backgroundColor: colors.coralBg,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.coralSoft,
  },
  stockAlertaText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.wine },

  // ── Movimientos ───────────────────────────────────────────
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  movRow: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  movIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  movMotivo: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  movFecha:  { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.muted, marginTop: 2 },
  movCantidad: { fontFamily: fonts.serifSemiBold, fontSize: 18 },

  // ── Botones peligrosos ────────────────────────────────────
  dangerBtn: {
  marginTop: 24,
  padding: 16,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.lineStrong, // más visible
  backgroundColor: colors.cream,  // ← agrega esto
  alignItems: 'center',
},
dangerBtnText: {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.wine,  // era colors.muted — más visible
},

  // ── Fields en edición ─────────────────────────────────────
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },
  pillsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.paper,
  },
  pillActive: { backgroundColor: colors.wine, borderColor: colors.wine },
  pillText:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  pillTextActive: { color: colors.paper },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  tallasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tallaChip: {
    width: 52, height: 42, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.input, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.paper,
  },
  tallaChipActive: { backgroundColor: colors.wine, borderColor: colors.wine },
  tallaText:       { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  tallaTextActive: { color: colors.paper },

  // ── Modales confirm ───────────────────────────────────────
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
  confirmBtns: { flexDirection: 'row', gap: 10 },
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

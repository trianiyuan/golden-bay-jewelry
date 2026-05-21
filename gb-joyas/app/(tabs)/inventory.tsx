// app/tabs/inventory.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, useWindowDimensions, Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../constants/colors';
import { PageHeader } from '../../components/ui/Header';
import { ProductCard } from '../../components/inventory/ProductCard';
import { getCategorias, getProductos, updateProducto } from '../../lib/queries/products';
import { Producto, Categoria } from '../../types';

const COLORES = [
  { key: 'todos', label: 'All' },
  { key: 'dorado', label: 'Gold', dot: '#D4AF37' },
  { key: 'plateado', label: 'Silver', dot: '#C0C0C0' },
  { key: 'rose_gold', label: 'Rose Gold', dot: '#ECABA0' },
];

export default function InventoryScreen() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { width } = useWindowDimensions();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('todos');
  const [colorActivo, setColorActivo] = useState('todos');
  const [tipoArete, setTipoArete] = useState('todos');
  const [stockBajoFilter, setStockBajoFilter] = useState(filter === 'stock_bajo');
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [loading, setLoading] = useState(true);

  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;
  const cardWidth = (width - SIZES.lg * 2 - 10 * (numColumns - 1)) / numColumns;
  const finalCardWidth = Math.min(cardWidth, 280);

  const cargar = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        getProductos({ activo: mostrarArchivados ? false : true }),
        getCategorias(),
      ]);
      setProductos(p);
      setCategorias(c);
    } finally { setLoading(false); }
  }, [mostrarArchivados]);

  useFocusEffect(cargar);

  React.useEffect(() => {
    if (filter === 'stock_bajo') setStockBajoFilter(true);
  }, [filter]);

  async function reactivarProducto(id: string) {
    try {
      await updateProducto(id, { activo: true });
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo reactivar el producto.');
    }
  }

  const categoriaActiva = categorias.find(c => c.id === catActiva);
  const esAretes = categoriaActiva?.nombre === 'Aretes';

  const productosFiltrados = productos.filter(p => {
    if (stockBajoFilter && p.cantidad >= 3) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (catActiva !== 'todos' && p.categoria_id !== catActiva) return false;
    if (colorActivo !== 'todos' && p.color !== colorActivo) return false;
    if (esAretes && tipoArete !== 'todos' && p.tipo_arete !== tipoArete) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader
        title="Inventario"
        rightElement={
          <TouchableOpacity style={styles.btnAgregar} onPress={() => router.push('/product/new')} activeOpacity={0.85}>
            <Text style={styles.btnAgregarText}>+ Agregar</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {stockBajoFilter && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => setStockBajoFilter(false)}>
            <Text style={styles.alertText}>⚠️ Mostrando productos con stock bajo — toca para limpiar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.archivadosToggle, mostrarArchivados && styles.archivadosToggleActive]}
          onPress={() => { setMostrarArchivados(prev => !prev); setStockBajoFilter(false); }}
        >
          <Text style={[styles.archivadosToggleText, mostrarArchivados && styles.archivadosToggleTextActive]}>
            {mostrarArchivados ? '← Volver al inventario activo' : '📦 Ver productos archivados'}
          </Text>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={mostrarArchivados ? 'Buscar archivados...' : 'Buscar joyería...'}
            placeholderTextColor={COLORS.textLight}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {!mostrarArchivados && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
              <TouchableOpacity style={[styles.chip, catActiva === 'todos' && styles.chipActive]} onPress={() => setCatActiva('todos')}>
                <Text style={[styles.chipText, catActiva === 'todos' && styles.chipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {categorias.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.chip, catActiva === cat.id && styles.chipActive]}
                  onPress={() => { setCatActiva(cat.id); setTipoArete('todos'); }}>
                  <Text style={[styles.chipText, catActiva === cat.id && styles.chipTextActive]}>{cat.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {esAretes && (
              <View style={styles.subfilterRow}>
                <Text style={styles.subfilterLabel}>TIPO:</Text>
                {['todos', 'regular', 'ear_cuff'].map(tipo => (
                  <TouchableOpacity key={tipo} style={[styles.subchip, tipoArete === tipo && styles.subchipActive]} onPress={() => setTipoArete(tipo)}>
                    <Text style={styles.subchipText}>{tipo === 'todos' ? 'All' : tipo === 'regular' ? 'Regular' : 'Ear Cuff'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.subfilterRow, { marginBottom: 14 }]}>
              <Text style={styles.subfilterLabel}>COLOR:</Text>
              {COLORES.map(c => (
                <TouchableOpacity key={c.key} style={[styles.subchip, colorActivo === c.key && styles.subchipActive]} onPress={() => setColorActivo(c.key)}>
                  {c.dot && <View style={[styles.colorDot, { backgroundColor: c.dot }]} />}
                  <Text style={styles.subchipText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.resultsCount}>
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
          {mostrarArchivados ? ' archivados' : ''}
        </Text>

        <View style={styles.grid}>
          {productosFiltrados.map(p => (
            <View key={p.id} style={{ width: finalCardWidth }}>
              <ProductCard
                producto={p}
                onReactivar={mostrarArchivados ? reactivarProducto : undefined}
              />
            </View>
          ))}
        </View>

        {productosFiltrados.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {mostrarArchivados ? '📦 Sin productos archivados' : stockBajoFilter ? '✓ Todo el stock en orden' : 'Sin productos con estos filtros'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  btnAgregar: { backgroundColor: COLORS.wine, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, shadowColor: '#622632', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnAgregarText: { fontSize: 12, fontWeight: '600', color: COLORS.surface },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg },
  alertBanner: { backgroundColor: '#FFF0EE', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#E8A090' },
  alertText: { fontSize: 12, color: COLORS.wine, fontWeight: '500', textAlign: 'center' },
  archivadosToggle: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', padding: 10, marginBottom: 12, alignItems: 'center' },
  archivadosToggleActive: { backgroundColor: '#FFF0EE', borderColor: COLORS.wine },
  archivadosToggleText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  archivadosToggleTextActive: { color: COLORS.wine },
  searchBar: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, shadowColor: '#622632', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary, padding: 0 },
  chipsScroll: { marginBottom: 8 },
  chipsContent: { gap: 8, paddingRight: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', backgroundColor: 'white' },
  chipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },
  subfilterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  subfilterLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5 },
  subchip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232,200,184,0.6)', backgroundColor: 'white' },
  subchipActive: { backgroundColor: '#ECABA0', borderColor: '#E09080' },
  subchipText: { fontSize: 11, fontWeight: '500', color: COLORS.textPrimary },
  colorDot: { width: 9, height: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  resultsCount: { fontSize: 11, color: COLORS.textMuted, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
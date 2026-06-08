// app/(tabs)/inventory.tsx — Boutique theme
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, useWindowDimensions, Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '../../constants/theme';
import { PageHeader } from '../../components/ui/Header';
import { ProductCard } from '../../components/inventory/ProductCard';
import { getCategorias, getProductos, updateProducto } from '../../lib/queries/products';
import { Producto, Categoria } from '../../types';

const COLORES = [
  { key: 'todos',    label: 'All',      dot: null },
  { key: 'dorado',   label: 'Gold',     dot: '#C9A24A' },
  { key: 'plateado', label: 'Silver',   dot: '#C4C4CA' },
  { key: 'rose_gold',label: 'Rose Gold',dot: '#E0A091' },
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
  const cardWidth = (width - 40 - 12 * (numColumns - 1)) / numColumns;
  const finalCardWidth = Math.min(cardWidth, 240);

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

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

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
          <TouchableOpacity style={styles.btnAdd} onPress={() => router.push('/product/new')} activeOpacity={0.85}>
            <Text style={styles.btnAddText}>+ Agregar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Banner stock bajo */}
        {stockBajoFilter && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => setStockBajoFilter(false)}>
            <Text style={styles.alertText}>Stock bajo — toca para limpiar filtro</Text>
          </TouchableOpacity>
        )}

        {/* Toggle archivados */}
        <TouchableOpacity
          style={[styles.archivadosBtn, mostrarArchivados && styles.archivadosBtnActive]}
          onPress={() => { setMostrarArchivados(prev => !prev); setStockBajoFilter(false); }}
        >
          <Text style={[styles.archivadosBtnText, mostrarArchivados && styles.archivadosBtnTextActive]}>
            {mostrarArchivados ? '← Volver al inventario activo' : 'Ver archivados'}
          </Text>
        </TouchableOpacity>

        {/* Barra de búsqueda */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>○</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={mostrarArchivados ? 'Buscar archivados…' : 'Buscar joyería…'}
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

        {/* Filtros (solo inventario activo) */}
        {!mostrarArchivados && (
          <>
            {/* Categorías */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            >
              <TouchableOpacity
                style={[styles.filterPill, catActiva === 'todos' && styles.filterPillActive]}
                onPress={() => setCatActiva('todos')}
              >
                <Text style={[styles.filterPillText, catActiva === 'todos' && styles.filterPillTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterPill, catActiva === cat.id && styles.filterPillActive]}
                  onPress={() => { setCatActiva(cat.id); setTipoArete('todos'); }}
                >
                  <Text style={[styles.filterPillText, catActiva === cat.id && styles.filterPillTextActive]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subtipo aretes */}
            {esAretes && (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>TIPO</Text>
                {['todos', 'regular', 'ear_cuff'].map(tipo => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.subPill, tipoArete === tipo && styles.subPillActive]}
                    onPress={() => setTipoArete(tipo)}
                  >
                    <Text style={[styles.subPillText, tipoArete === tipo && styles.subPillTextActive]}>
                      {tipo === 'todos' ? 'All' : tipo === 'regular' ? 'Regular' : 'Ear Cuff'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Color */}
            <View style={[styles.subRow, { marginBottom: 14 }]}>
              <Text style={styles.subLabel}>COLOR</Text>
              {COLORES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.subPill, colorActivo === c.key && styles.subPillActive]}
                  onPress={() => setColorActivo(c.key)}
                >
                  {c.dot && (
                    <View style={[styles.colorDot, { backgroundColor: c.dot }]} />
                  )}
                  <Text style={[styles.subPillText, colorActivo === c.key && styles.subPillTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Contador */}
        <Text style={styles.count}>
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
          {mostrarArchivados ? ' archivados' : ''}
        </Text>

        {/* Grid */}
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

        {/* Estado vacío */}
        {productosFiltrados.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {mostrarArchivados
                ? 'Sin productos archivados'
                : stockBajoFilter
                ? 'Todo el stock en orden'
                : 'Sin productos con estos filtros'}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0E8DF' },
scroll: { flex: 1, backgroundColor: '#F0E8DF' },
  content: { padding: 20, paddingBottom: 40 },

  // ── Botón agregar ─────────────────────────────────────────
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

  // ── Banner stock bajo ─────────────────────────────────────
  alertBanner: {
    backgroundColor: colors.coralBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.coralSoft,
    alignItems: 'center',
  },
  alertText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.wine,
    textAlign: 'center',
  },

  // ── Toggle archivados ─────────────────────────────────────
  archivadosBtn: {
    backgroundColor: colors.paper,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  archivadosBtnActive: {
    backgroundColor: colors.coralBg,
    borderColor: colors.wine,
  },
  archivadosBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.muted,
  },
  archivadosBtnTextActive: {
    fontFamily: fonts.sansSemiBold,
    color: colors.wine,
  },

  // ── Búsqueda ──────────────────────────────────────────────
  searchBar: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    color: colors.muted2,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  searchClear: {
    fontSize: 14,
    color: colors.muted,
  },

  // ── Pills de categoría ────────────────────────────────────
  filtersScroll: { marginBottom: 10 },
  filtersContent: { gap: 8, paddingRight: 4 },
  filterPill: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 100,       // ← pill completo
  borderWidth: 1,
  borderColor: colors.lineStrong,
  backgroundColor: colors.paper,
},
filterPillActive: {
  backgroundColor: colors.wine,
  borderColor: colors.wine,
},
filterPillText: {
  fontFamily: fonts.sansSemiBold,
  fontSize: 13,
  color: colors.muted,
},
filterPillTextActive: {
  color: colors.paper,
},

  // ── Subpills (tipo / color) ───────────────────────────────
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  subLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginRight: 2,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
  },
  subPillActive: {
    borderColor: colors.gold,
    backgroundColor: colors.paper,
  },
  subPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.muted,
  },
  subPillTextActive: {
    color: colors.wine,
    fontFamily: fonts.sansSemiBold,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },

  // ── Contador y grid ───────────────────────────────────────
  count: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center', // ← Alinea a la izquierda
  },
  
  // ── Estado vacío ──────────────────────────────────────────
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});

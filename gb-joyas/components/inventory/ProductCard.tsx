// components/inventory/ProductCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Producto } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';

const COLOR_DOTS: Record<string, string> = {
  dorado: '#D4AF37', plateado: '#C0C0C0', rose_gold: '#ECABA0',
};
const COLOR_LABELS: Record<string, string> = {
  dorado: 'Oro', plateado: 'Plata', rose_gold: 'Oro Rosa',
};

export function ProductCard({ producto }: { producto: Producto }) {
  const router = useRouter();
  const stockBajo = producto.cantidad < 3;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/product/${producto.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {producto.imagen_url ? (
          <Image source={{ uri: producto.imagen_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>💍</Text>
          </View>
        )}
        {stockBajo && (
          <View style={styles.stockBadgeOverlay}>
            <Text style={styles.stockBadgeOverlayText}>Stock bajo</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.nombre} numberOfLines={1}>{producto.nombre}</Text>
        <View style={styles.meta}>
          <View style={[styles.colorDot, { backgroundColor: COLOR_DOTS[producto.color] || COLORS.border }]} />
          <Text style={styles.metaText} numberOfLines={1}>
            {COLOR_LABELS[producto.color]} · {producto.talla?.valor}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.precio}>
            ₡{(producto.precio_venta || (producto as any).precio || 0).toLocaleString('es-CR')}
          </Text>
          <View style={[styles.stockBadge, stockBajo && styles.stockBadgeLow]}>
            <Text style={[styles.stockText, stockBajo && styles.stockTextLow]}>
              {producto.cantidad} {producto.categoria?.unidad === 'par' ? 'pr' : 'u'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.blush,
    alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 28 },
  stockBadgeOverlay: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: COLORS.wine,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  stockBadgeOverlayText: { fontSize: 9, color: COLORS.surface, fontWeight: '600' },

  body: { padding: 8 },
  nombre: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  colorDot: {
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  metaText: { fontSize: 10, color: COLORS.textMuted, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  precio: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  stockBadge: {
    backgroundColor: COLORS.rose, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  stockBadgeLow: { backgroundColor: COLORS.wine },
  stockText: { fontSize: 9, color: COLORS.textPrimary },
  stockTextLow: { color: COLORS.surface },
});

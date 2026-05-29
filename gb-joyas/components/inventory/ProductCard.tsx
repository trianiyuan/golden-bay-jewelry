// components/inventory/ProductCard.tsx — Boutique theme
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Producto } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';

const COLOR_DOTS: Record<string, string> = {
  dorado:    '#C9A24A',
  plateado:  '#C4C4CA',
  rose_gold: '#E0A091',
};
const COLOR_LABELS: Record<string, string> = {
  dorado:    'Oro',
  plateado:  'Plata',
  rose_gold: 'Oro Rosa',
};

// Ícono diamante placeholder (sin emoji)
function DiamondPlaceholder() {
  return (
    <View style={styles.placeholderInner}>
      <Text style={styles.placeholderGlyph}>◇</Text>
      <Text style={styles.placeholderCap}>FOTO</Text>
    </View>
  );
}

export function ProductCard({
  producto,
  onReactivar,
}: {
  producto: Producto;
  onReactivar?: (id: string) => void;
}) {
  const router = useRouter();
  const stockBajo = producto.cantidad < 3;
  const archivado = !producto.activo;

  return (
    <TouchableOpacity
      style={[styles.card, archivado && styles.cardArchivado]}
      onPress={() => !archivado && router.push(`/product/${producto.id}`)}
      activeOpacity={archivado ? 1 : 0.88}
    >
      {/* Imagen / placeholder */}
      <View style={styles.imgWrap}>
        {producto.imagen_url ? (
          <Image
            source={{ uri: producto.imagen_url }}
            style={styles.img}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imgPlaceholder}>
            <DiamondPlaceholder />
          </View>
        )}

        {/* Badge archivado */}
        {archivado && (
          <View style={styles.badgeArchivado}>
            <Text style={styles.badgeText}>Archivado</Text>
          </View>
        )}

        {/* Badge stock bajo */}
        {!archivado && stockBajo && (
          <View style={styles.badgeStockBajo}>
            <Text style={styles.badgeText}>Stock bajo</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.nombre} numberOfLines={1}>{producto.nombre}</Text>

        <View style={styles.meta}>
          <View style={[styles.colorDot, { backgroundColor: COLOR_DOTS[producto.color] || colors.muted2 }]} />
          <Text style={styles.metaText} numberOfLines={1}>
            {COLOR_LABELS[producto.color]} · {producto.talla?.valor}
          </Text>
        </View>

        {archivado ? (
          <TouchableOpacity
            style={styles.reactivarBtn}
            onPress={() => onReactivar?.(producto.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.reactivarText}>Reactivar</Text>
          </TouchableOpacity>
        ) : (
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
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
  backgroundColor: colors.cream,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.lineStrong, // era colors.line
  overflow: 'hidden',
},
  cardArchivado: {
    opacity: 0.65,
  },

  // ── Imagen ────────────────────────────────────────────────
  imgWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // textura diagonal del sistema
    backgroundColor: '#F7E6E0',
  },
  placeholderInner: {
    alignItems: 'center',
    gap: 6,
  },
  placeholderGlyph: {
    fontSize: 22,
    color: colors.muted,
    opacity: 0.4,
  },
  placeholderCap: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.muted,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255,252,250,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // ── Badges de overlay ─────────────────────────────────────
  badgeArchivado: {
    position: 'absolute',
    top: 7, right: 7,
    backgroundColor: colors.muted,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeStockBajo: {
    position: 'absolute',
    top: 7, right: 7,
    backgroundColor: colors.wine,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.paper,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ── Body ──────────────────────────────────────────────────
  body: { padding: 12 },
  nombre: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  metaText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },

  // ── Footer precio + stock ─────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  precio: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 18,
    color: colors.ink,
  },
  stockBadge: {
    backgroundColor: colors.chipFeriaBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  stockBadgeLow: {
    backgroundColor: colors.coralBg,
  },
  stockText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.chipFeriaText,
    letterSpacing: 0.3,
  },
  stockTextLow: {
    color: colors.wine,
  },

  // ── Botón reactivar ───────────────────────────────────────
  reactivarBtn: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  reactivarText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.wine,
  },
});

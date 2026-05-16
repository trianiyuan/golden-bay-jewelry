// app/product/new.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { getCategorias, getTallasPorCategoria, createProducto, uploadImagenProducto } from '../../lib/queries/products';
import { Categoria, TallaPorCategoria } from '../../types';
import { COLORS, SIZES } from '../../constants/colors';

type FormData = {
  nombre: string;
  descripcion: string;
  precio_venta: string;
  precio_costo: string;
  cantidad: string;
};

const COLORES = [
  { key: 'dorado', label: 'Oro', dot: '#D4AF37' },
  { key: 'plateado', label: 'Plata', dot: '#C0C0C0' },
  { key: 'rose_gold', label: 'Oro Rosa', dot: '#ECABA0' },
];

function RequiredLabel({ label }: { label: string }) {
  return (
    <Text style={styles.fieldLabel}>
      {label.toUpperCase()} <Text style={{ color: COLORS.error }}>*</Text>
    </Text>
  );
}

export default function NewProductScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tallas, setTallas] = useState<TallaPorCategoria[]>([]);
  const [catSeleccionada, setCatSeleccionada] = useState('');
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('dorado');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { nombre: '', descripcion: '', precio_venta: '', precio_costo: '', cantidad: '' },
  });

  useEffect(() => { getCategorias().then(setCategorias); }, []);

  useEffect(() => {
    if (catSeleccionada) {
      getTallasPorCategoria(catSeleccionada).then(t => {
        setTallas(t); setTallaSeleccionada('');
      });
    }
  }, [catSeleccionada]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImagenUri(result.assets[0].uri);
  }

  async function onSubmit(data: FormData) {
    setSubmitted(true);
    if (!catSeleccionada || !tallaSeleccionada) return;

    try {
      setSaving(true);
      const producto = await createProducto({
        nombre: data.nombre.trim(),
        descripcion: data.descripcion.trim() || undefined,
        precio_venta: parseFloat(data.precio_venta),
        precio_costo: parseFloat(data.precio_costo),
        cantidad: parseInt(data.cantidad),
        categoria_id: catSeleccionada,
        talla_id: tallaSeleccionada,
        color: colorSeleccionado,
        activo: true,
      });

      if (imagenUri) {
        const url = await uploadImagenProducto(producto.id, imagenUri);
        const { supabase } = await import('../../lib/supabase');
        await supabase.from('productos').update({ imagen_url: url }).eq('id', producto.id);
      }

      router.replace('/(tabs)/inventory');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  const catError = submitted && !catSeleccionada;
  const tallaError = submitted && !tallaSeleccionada;

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack backLabel="‹ Cancelar" title="Nuevo Producto" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Image */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Agregar foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {imagenUri && (
          <TouchableOpacity onPress={pickImage} style={styles.changeImageBtn}>
            <Text style={styles.changeImageText}>Cambiar foto</Text>
          </TouchableOpacity>
        )}

        {/* Name */}
        <Controller
          control={control} name="nombre"
          rules={{ required: 'El nombre es obligatorio' }}
          render={({ field: { onChange, value } }) => (
            <Input label="Nombre del producto *" value={value} onChangeText={onChange}
              placeholder="Ej. Anillo solitario" error={errors.nombre?.message} />
          )}
        />

        {/* Category */}
        <RequiredLabel label="Category" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={styles.chipsRow}>
            {categorias.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, catSeleccionada === cat.id && styles.chipActive,
                  catError && !catSeleccionada && styles.chipError]}
                onPress={() => setCatSeleccionada(cat.id)}
              >
                <Text style={[styles.chipText, catSeleccionada === cat.id && styles.chipTextActive]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {catError && <Text style={styles.errorMsg}>Seleccioná una categoría</Text>}

        {/* Size */}
        {tallas.length > 0 && (
          <>
            <RequiredLabel label="Size" />
            <View style={styles.tallasGrid}>
              {tallas.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tallaChip, tallaSeleccionada === t.id && styles.tallaChipActive,
                    tallaError && styles.chipError]}
                  onPress={() => setTallaSeleccionada(t.id)}
                >
                  <Text style={[styles.tallaText, tallaSeleccionada === t.id && styles.tallaTextActive]}>
                    {t.valor}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tallaError && <Text style={styles.errorMsg}>Seleccioná una talla</Text>}
          </>
        )}

        {/* Color */}
        <RequiredLabel label="Color" />
        <View style={[styles.chipsRow, { marginBottom: 14 }]}>
          {COLORES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, colorSeleccionado === c.key && styles.chipActive]}
              onPress={() => setColorSeleccionado(c.key)}
            >
              <View style={[styles.colorDot, { backgroundColor: c.dot }]} />
              <Text style={[styles.chipText, colorSeleccionado === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sale price */}
        <Controller
          control={control} name="precio_venta"
          rules={{ required: 'El precio de venta es obligatorio', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Precio inválido' } }}
          render={({ field: { onChange, value } }) => (
            <Input label="Precio de venta (₡) *" value={value} onChangeText={onChange}
              keyboardType="numeric" placeholder="18000" error={errors.precio_venta?.message} />
          )}
        />

        {/* Cost price */}
        <Controller
          control={control} name="precio_costo"
          rules={{ required: 'El precio de costo es obligatorio', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Precio inválido' } }}
          render={({ field: { onChange, value } }) => (
            <Input label="Precio de costo (₡) * — lo que pagaste a la proveedora"
              value={value} onChangeText={onChange}
              keyboardType="numeric" placeholder="5000" error={errors.precio_costo?.message} />
          )}
        />

        {/* Quantity */}
        <Controller
          control={control} name="cantidad"
          rules={{ required: 'La cantidad es obligatoria', pattern: { value: /^\d+$/, message: 'Ingresá un número entero' } }}
          render={({ field: { onChange, value } }) => (
            <Input label="Cantidad inicial *" value={value} onChangeText={onChange}
              keyboardType="numeric" placeholder="5" error={errors.cantidad?.message} />
          )}
        />

        {/* Description */}
        <Controller
          control={control} name="descripcion"
          render={({ field: { onChange, value } }) => (
            <Input label="Descripción / Detalles (opcional)" value={value} onChangeText={onChange}
              placeholder="Material, largo, detalles especiales..."
              multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
          )}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving} activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={COLORS.surface} />
            : <Text style={styles.saveBtnText}>Guardar producto</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg },

  imagePicker: {
    width: '100%', aspectRatio: 1, borderRadius: SIZES.radiusLg,
    overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, backgroundColor: COLORS.blush,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  imagePlaceholderIcon: { fontSize: 40 },
  imagePlaceholderText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  changeImageBtn: { alignItems: 'center', marginBottom: 16 },
  changeImageText: { fontSize: 13, color: COLORS.wine, fontWeight: '500' },

  fieldLabel: {
    fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted,
    letterSpacing: 0.7, marginBottom: 8, marginTop: 4,
  },
  errorMsg: { fontSize: 11, color: COLORS.error, marginBottom: 8, marginTop: -4 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  chipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  chipError: { borderColor: COLORS.error },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },

  tallasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tallaChip: {
    width: 52, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  tallaChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  tallaText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  tallaTextActive: { color: COLORS.surface },

  footer: {
    padding: 12, paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '600' },
});

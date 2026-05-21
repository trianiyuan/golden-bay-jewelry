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

const TIPOS_ARETE = [
  { key: 'regular', label: 'Regular' },
  { key: 'ear_cuff', label: 'Ear Cuff' },
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
  const [tipoAreteSeleccionado, setTipoAreteSeleccionado] = useState<'regular' | 'ear_cuff' | null>(null);
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

  const categoriaActiva = categorias.find(c => c.id === catSeleccionada);
  const esAretes = categoriaActiva?.nombre === 'Aretes';

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
    if (esAretes && !tipoAreteSeleccionado) {
      Alert.alert('Campo requerido', 'Seleccioná el tipo de arete.');
      return;
    }

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
        tipo_arete: esAretes ? tipoAreteSeleccionado ?? undefined : undefined,
      } as any);

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

        <View style={styles.topRow}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
            {imagenUri ? (
              <Image source={{ uri: imagenUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.topInfo}>
            <Controller
              control={control} name="nombre"
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Nombre *" value={value} onChangeText={onChange}
                  placeholder="Ej. Anillo solitario" error={errors.nombre?.message} />
              )}
            />
            <Controller
              control={control} name="precio_venta"
              rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Precio venta (₡) *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric" placeholder="18000" error={errors.precio_venta?.message} />
              )}
            />
            <Controller
              control={control} name="precio_costo"
              rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Precio costo (₡) *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric" placeholder="5000" error={errors.precio_costo?.message} />
              )}
            />
            <Controller
              control={control} name="cantidad"
              rules={{ required: 'Requerido', pattern: { value: /^\d+$/, message: 'Solo números enteros' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Cantidad *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric" placeholder="5" error={errors.cantidad?.message} />
              )}
            />
          </View>
        </View>

        <RequiredLabel label="Categoría" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={styles.chipsRow}>
            {categorias.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, catSeleccionada === cat.id && styles.chipActive, catError && styles.chipError]}
                onPress={() => { setCatSeleccionada(cat.id); setTipoAreteSeleccionado(null); }}
              >
                <Text style={[styles.chipText, catSeleccionada === cat.id && styles.chipTextActive]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {catError && <Text style={styles.errorMsg}>Seleccioná una categoría</Text>}

        {tallas.length > 0 && (
          <>
            <RequiredLabel label="Talla" />
            <View style={styles.tallasGrid}>
              {tallas.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tallaChip, tallaSeleccionada === t.id && styles.tallaChipActive, tallaError && styles.chipError]}
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

        {esAretes && (
          <>
            <RequiredLabel label="Tipo de arete" />
            <View style={[styles.chipsRow, { marginBottom: 14 }]}>
              {TIPOS_ARETE.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, tipoAreteSeleccionado === t.key && styles.chipActive]}
                  onPress={() => setTipoAreteSeleccionado(t.key as 'regular' | 'ear_cuff')}
                >
                  <Text style={[styles.chipText, tipoAreteSeleccionado === t.key && styles.chipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

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

        <Controller
          control={control} name="descripcion"
          render={({ field: { onChange, value } }) => (
            <Input label="Descripción (opcional)" value={value} onChangeText={onChange}
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
  topRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  imagePicker: { width: 120, height: 120, borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, flexShrink: 0 },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, backgroundColor: COLORS.blush, alignItems: 'center', justifyContent: 'center', gap: 4 },
  imagePlaceholderIcon: { fontSize: 28 },
  imagePlaceholderText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  topInfo: { flex: 1 },
  fieldLabel: { fontSize: SIZES.textXs, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },
  errorMsg: { fontSize: 11, color: COLORS.error, marginBottom: 8, marginTop: -4 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  chipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  chipError: { borderColor: COLORS.error },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  tallasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tallaChip: { width: 52, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  tallaChipActive: { backgroundColor: COLORS.wine, borderColor: COLORS.wine },
  tallaText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  tallaTextActive: { color: COLORS.surface },
  footer: { padding: 12, paddingHorizontal: SIZES.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '600' },
});
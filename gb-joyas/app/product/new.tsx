// app/product/new.tsx — Boutique theme
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Image, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/ui/Header';
import { getCategorias, getTallasPorCategoria, createProducto, uploadImagenProducto } from '../../lib/queries/products';
import { Categoria, TallaPorCategoria } from '../../types';
import { colors, fonts, radius } from '../../constants/theme';

type FormData = {
  nombre: string;
  descripcion: string;
  precio_venta: string;
  precio_costo: string;
  cantidad: string;
};

const COLORES = [
  { key: 'dorado',    label: 'Oro',      dot: '#C9A24A' },
  { key: 'plateado',  label: 'Plata',    dot: '#C4C4CA' },
  { key: 'rose_gold', label: 'Oro Rosa', dot: '#E0A091' },
];

const TIPOS_ARETE = [
  { key: 'regular',  label: 'Regular'  },
  { key: 'ear_cuff', label: 'Ear Cuff' },
];

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label.toUpperCase()}{required && <Text style={{ color: colors.coral }}> *</Text>}
    </Text>
  );
}

export default function NewProductScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

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

  // ── Zona de foto ─────────────────────────────────────────
  const PhotoZone = ({ style }: { style?: any }) => (
    <TouchableOpacity style={[styles.photoZone, style]} onPress={pickImage} activeOpacity={0.85}>
      {imagenUri ? (
        <>
          <Image source={{ uri: imagenUri }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoOverlayText}>Cambiar foto</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.photoGlyph}>◇</Text>
          <Text style={styles.photoHint}>Tocá para agregar foto</Text>
          <View style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>Agregar foto</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  // ── Campos extra (categoría, talla, tipo, color, desc) ──
  const ExtraFields = () => (
    <>
      <FieldLabel label="Categoría" required />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={styles.pillsRow}>
          {categorias.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, catSeleccionada === cat.id && styles.pillActive, catError && styles.pillError]}
              onPress={() => { setCatSeleccionada(cat.id); setTipoAreteSeleccionado(null); }}
            >
              <Text style={[styles.pillText, catSeleccionada === cat.id && styles.pillTextActive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {catError && <Text style={styles.errorMsg}>Seleccioná una categoría</Text>}

      {tallas.length > 0 && (
        <>
          <FieldLabel label="Talla" required />
          <View style={styles.tallasGrid}>
            {tallas.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tallaChip, tallaSeleccionada === t.id && styles.tallaChipActive, tallaError && styles.pillError]}
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
          <FieldLabel label="Tipo de arete" required />
          <View style={[styles.pillsRow, { marginBottom: 14 }]}>
            {TIPOS_ARETE.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.pill, tipoAreteSeleccionado === t.key && styles.pillActive]}
                onPress={() => setTipoAreteSeleccionado(t.key as 'regular' | 'ear_cuff')}
              >
                <Text style={[styles.pillText, tipoAreteSeleccionado === t.key && styles.pillTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <FieldLabel label="Color" required />
      <View style={[styles.pillsRow, { marginBottom: 14 }]}>
        {COLORES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.pill, colorSeleccionado === c.key && styles.pillActive]}
            onPress={() => setColorSeleccionado(c.key)}
          >
            <View style={[styles.colorDot, { backgroundColor: c.dot }]} />
            <Text style={[styles.pillText, colorSeleccionado === c.key && styles.pillTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Controller
        control={control} name="descripcion"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Descripción (opcional)"
            value={value}
            onChangeText={onChange}
            placeholder="Material, largo, detalles especiales..."
            multiline numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />
        )}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack backLabel="‹ Cancelar" title="Nuevo producto" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isDesktop ? (
          <View style={styles.desktopRow}>
            <PhotoZone style={styles.desktopPhoto} />
            <View style={styles.desktopFields}>
              <Controller
                control={control} name="nombre"
                rules={{ required: 'El nombre es obligatorio' }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Nombre *" value={value} onChangeText={onChange}
                    placeholder="Ej. Anillo solitario" error={errors.nombre?.message} />
                )}
              />
              <View style={styles.pricesRow}>
                <View style={{ flex: 1 }}>
                  <Controller control={control} name="precio_venta"
                    rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
                    render={({ field: { onChange, value } }) => (
                      <Input label="Precio venta (₡) *" value={value}
                        onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                        keyboardType="numeric" placeholder="18 000" error={errors.precio_venta?.message} />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller control={control} name="precio_costo"
                    rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
                    render={({ field: { onChange, value } }) => (
                      <Input label="Precio costo (₡) *" value={value}
                        onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                        keyboardType="numeric" placeholder="5 000" error={errors.precio_costo?.message} />
                    )}
                  />
                </View>
                <View style={{ width: 110 }}>
                  <Controller control={control} name="cantidad"
                    rules={{ required: 'Requerido', pattern: { value: /^\d+$/, message: 'Solo números' } }}
                    render={({ field: { onChange, value } }) => (
                      <Input label="Cantidad *" value={value}
                        onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric" placeholder="5" error={errors.cantidad?.message} />
                    )}
                  />
                </View>
              </View>
              <ExtraFields />
            </View>
          </View>
        ) : (
          <>
            <PhotoZone style={styles.mobilePhoto} />
            <Controller control={control} name="nombre"
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Nombre *" value={value} onChangeText={onChange}
                  placeholder="Ej. Anillo solitario" error={errors.nombre?.message} />
              )}
            />
            <Controller control={control} name="precio_venta"
              rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Precio venta (₡) *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric" placeholder="18 000" error={errors.precio_venta?.message} />
              )}
            />
            <Controller control={control} name="precio_costo"
              rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Precio costo (₡) *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric" placeholder="5 000" error={errors.precio_costo?.message} />
              )}
            />
            <Controller control={control} name="cantidad"
              rules={{ required: 'Requerido', pattern: { value: /^\d+$/, message: 'Solo números' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="Cantidad *" value={value}
                  onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric" placeholder="5" error={errors.cantidad?.message} />
              )}
            />
            <ExtraFields />
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.paper} />
            : <Text style={styles.saveBtnText}>Guardar producto</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { padding: 20 },

  // Desktop
  desktopRow:    { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  desktopPhoto:  { width: '35%', flexShrink: 0 },
  desktopFields: { flex: 1 },
  pricesRow:     { flexDirection: 'row', gap: 12 },

  // Mobile
  mobilePhoto: { width: '100%', aspectRatio: 1.4, marginBottom: 20 },

  // ── Zona de foto ─────────────────────────────────────────
  photoZone: {
    aspectRatio: 1,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.goldLine,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F7E6E0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoGlyph: {
    fontSize: 28,
    color: colors.muted,
    opacity: 0.5,
  },
  photoHint: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.muted,
  },
  photoBtn: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  photoBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.wine,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(90,27,43,0.5)',
    padding: 10,
    alignItems: 'center',
  },
  photoOverlayText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.paper,
  },

  // ── Labels y errores ──────────────────────────────────────
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

  // ── Pills ─────────────────────────────────────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  pillActive: {
    backgroundColor: colors.wine,
    borderColor: colors.wine,
  },
  pillError: {
    borderColor: colors.coral,
  },
  pillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  pillTextActive: {
    color: colors.paper,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },

  // ── Tallas ────────────────────────────────────────────────
  tallasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tallaChip: {
    width: 52,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  tallaChipActive: {
    backgroundColor: colors.wine,
    borderColor: colors.wine,
  },
  tallaText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  tallaTextActive: {
    color: colors.paper,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    padding: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  saveBtn: {
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

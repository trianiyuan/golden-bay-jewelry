// app/settings.tsx — Boutique theme
import React, { useEffect, useState } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Header } from '../components/ui/Header';
import { colors, fonts, radius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { getCategorias, getTallasPorCategoria } from '../lib/queries/products';

interface Item { id: string; nombre: string; [key: string]: any; }

export default function SettingsScreen() {
  const [categorias, setCategorias] = useState<Item[]>([]);
  const [canales, setCanales] = useState<Item[]>([]);
  const [categoriasGasto, setCategoriasGasto] = useState<Item[]>([]);
  const [tallasPorCat, setTallasPorCat] = useState<Record<string, Item[]>>({});
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{
    visible: boolean;
    tipo: 'categoria' | 'canal' | 'gasto' | 'talla';
    item?: Item;
    parentId?: string;
    parentNombre?: string;
  }>({ visible: false, tipo: 'categoria' });

  const [inputNombre, setInputNombre] = useState('');
  const [inputComision, setInputComision] = useState('');
  const [inputCostoFijo, setInputCostoFijo] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [cats, cans, gastos] = await Promise.all([
        getCategorias(),
        supabase.from('canales_venta').select('*').order('nombre'),
        supabase.from('categorias_gasto').select('*').order('nombre'),
      ]);
      setCategorias(cats || []);
      setCanales(cans.data || []);
      setCategoriasGasto(gastos.data || []);
    } finally { setLoading(false); }
  }

  async function cargarTallas(catId: string) {
    const tallas = await getTallasPorCategoria(catId);
    setTallasPorCat(prev => ({ ...prev, [catId]: tallas || [] }));
  }

  function abrirModal(tipo: typeof modal.tipo, item?: Item, parentId?: string, parentNombre?: string) {
    setInputNombre(item?.nombre || item?.valor || '');
    setInputComision(tipo === 'canal' ? String(item?.comision_porcentaje || 0) : '');
    setInputCostoFijo(tipo === 'canal' ? String(item?.costo_fijo_mensual || 0) : '');
    setModal({ visible: true, tipo, item, parentId, parentNombre });
  }

  async function guardar() {
    if (!inputNombre.trim()) return;
    setSaving(true);
    try {
      const { tipo, item, parentId } = modal;
      if (tipo === 'categoria') {
        if (item) await supabase.from('categorias').update({ nombre: inputNombre.trim() }).eq('id', item.id);
        else await supabase.from('categorias').insert({ nombre: inputNombre.trim(), unidad: 'unidad' });
      } else if (tipo === 'canal') {
        const data = {
          nombre: inputNombre.trim(),
          comision_porcentaje: parseFloat(inputComision) || 0,
          costo_fijo_mensual: parseFloat(inputCostoFijo) || 0,
        };
        if (item) await supabase.from('canales_venta').update(data).eq('id', item.id);
        else await supabase.from('canales_venta').insert({ ...data, activo: true, es_editable: true });
      } else if (tipo === 'gasto') {
        if (item) await supabase.from('categorias_gasto').update({ nombre: inputNombre.trim() }).eq('id', item.id);
        else await supabase.from('categorias_gasto').insert({ nombre: inputNombre.trim(), es_editable: true });
      } else if (tipo === 'talla' && parentId) {
        if (item) await supabase.from('tallas_por_categoria').update({ valor: inputNombre.trim() }).eq('id', item.id);
        else {
          const tallasCat = tallasPorCat[parentId] || [];
          await supabase.from('tallas_por_categoria').insert({
            categoria_id: parentId, valor: inputNombre.trim(), orden: tallasCat.length + 1,
          });
        }
        await cargarTallas(parentId);
      }
      await cargar();
      setModal({ visible: false, tipo: 'categoria' });
    } finally { setSaving(false); }
  }

  async function eliminar() {
    if (!modal.item) return;
    setSaving(true);
    try {
      const { tipo, item, parentId } = modal;
      if (tipo === 'categoria')  await supabase.from('categorias').delete().eq('id', item!.id);
      else if (tipo === 'canal') await supabase.from('canales_venta').delete().eq('id', item!.id);
      else if (tipo === 'gasto') await supabase.from('categorias_gasto').delete().eq('id', item!.id);
      else if (tipo === 'talla') {
        await supabase.from('tallas_por_categoria').delete().eq('id', item!.id);
        if (parentId) await cargarTallas(parentId);
      }
      await cargar();
      setModal({ visible: false, tipo: 'categoria' });
    } finally { setSaving(false); }
  }

  async function toggleCanal(canal: Item) {
    await supabase.from('canales_venta').update({ activo: !canal.activo }).eq('id', canal.id);
    await cargar();
  }

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <Header showBack title="Configuración" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.wine} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack title="Configuración" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Categorías ── */}
        <Section
          title="CATEGORÍAS"
          onAdd={() => abrirModal('categoria')}
        >
          {categorias.map(cat => (
            <View key={cat.id}>
              <View style={styles.item}>
                <TouchableOpacity
                  style={styles.itemExpand}
                  onPress={() => {
                    if (expandedCat === cat.id) {
                      setExpandedCat(null);
                    } else {
                      setExpandedCat(cat.id);
                      if (!tallasPorCat[cat.id]) cargarTallas(cat.id);
                    }
                  }}
                >
                  <Text style={styles.itemNombre}>{cat.nombre}</Text>
                  <Text style={styles.expandIcon}>{expandedCat === cat.id ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => abrirModal('categoria', cat)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>

              {expandedCat === cat.id && (
                <View style={styles.tallasWrap}>
                  <View style={styles.tallasHeader}>
                    <Text style={styles.tallasTitle}>Tallas de {cat.nombre}</Text>
                    <TouchableOpacity style={styles.addBtnSmall} onPress={() => abrirModal('talla', undefined, cat.id, cat.nombre)}>
                      <Text style={styles.addBtnSmallText}>+ Talla</Text>
                    </TouchableOpacity>
                  </View>
                  {(tallasPorCat[cat.id] || []).map(t => (
                    <View key={t.id} style={styles.tallaItem}>
                      <Text style={styles.tallaValor}>{t.valor}</Text>
                      <TouchableOpacity onPress={() => abrirModal('talla', t, cat.id, cat.nombre)}>
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {(tallasPorCat[cat.id] || []).length === 0 && (
                    <Text style={styles.emptyText}>Sin tallas — agregá la primera</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </Section>

        {/* ── Canales de venta ── */}
        <Section title="CANALES DE VENTA" onAdd={() => abrirModal('canal')}>
          {canales.map(canal => (
            <View key={canal.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemNombre, !canal.activo && { color: colors.muted }]}>
                  {canal.nombre}
                  {!canal.activo && <Text style={styles.inactivo}> (inactivo)</Text>}
                </Text>
                {(canal.comision_porcentaje > 0 || canal.costo_fijo_mensual > 0) && (
                  <Text style={styles.comisionText}>
                    {canal.comision_porcentaje > 0 ? `Comisión: ${canal.comision_porcentaje}%` : ''}
                    {canal.comision_porcentaje > 0 && canal.costo_fijo_mensual > 0 ? ' · ' : ''}
                    {canal.costo_fijo_mensual > 0 ? `Fijo: ₡${Number(canal.costo_fijo_mensual).toLocaleString('es-CR')}/mes` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => toggleCanal(canal)}>
                  <Text style={[styles.toggleText, { color: canal.activo ? colors.muted : colors.wine }]}>
                    {canal.activo ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => abrirModal('canal', canal)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Section>

        {/* ── Categorías de gasto ── */}
        <Section title="CATEGORÍAS DE GASTO" onAdd={() => abrirModal('gasto')}>
          {categoriasGasto.map(g => (
            <View key={g.id} style={styles.item}>
              <Text style={styles.itemNombre}>{g.nombre}</Text>
              <TouchableOpacity onPress={() => abrirModal('gasto', g)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal editar/agregar ── */}
      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modal.item ? 'Editar' : 'Agregar'}{' '}
              {modal.tipo === 'categoria' ? 'categoría'
                : modal.tipo === 'canal' ? 'canal de venta'
                : modal.tipo === 'gasto' ? 'categoría de gasto'
                : `talla — ${modal.parentNombre}`}
            </Text>

            <Text style={styles.fieldLabel}>NOMBRE</Text>
            <TextInput
              style={styles.modalInput}
              value={inputNombre}
              onChangeText={setInputNombre}
              placeholder="Nombre..."
              placeholderTextColor={colors.muted2}
              autoFocus
            />

            {modal.tipo === 'canal' && (
              <>
                <Text style={styles.fieldLabel}>COMISIÓN (%)</Text>
                <Text style={styles.fieldHint}>Si el canal cobra comisión sobre la venta. Dejá 0 si no aplica.</Text>
                <TextInput
                  style={styles.modalInput}
                  value={inputComision}
                  onChangeText={setInputComision}
                  placeholder="Ej: 30"
                  placeholderTextColor={colors.muted2}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>COSTO FIJO MENSUAL (₡)</Text>
                <Text style={styles.fieldHint}>Si el canal cobra un monto fijo por mes.</Text>
                <TextInput
                  style={styles.modalInput}
                  value={inputCostoFijo}
                  onChangeText={setInputCostoFijo}
                  placeholder="Ej: 10 000"
                  placeholderTextColor={colors.muted2}
                  keyboardType="numeric"
                />
              </>
            )}

            <TouchableOpacity style={styles.modalBtnPrimary} onPress={guardar} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.paper} size="small" />
                : <Text style={styles.modalBtnPrimaryText}>{modal.item ? 'Guardar cambios' : 'Agregar'}</Text>
              }
            </TouchableOpacity>

            {modal.item && (
              <TouchableOpacity style={styles.modalBtnDelete} onPress={eliminar} disabled={saving}>
                <Text style={styles.modalBtnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModal({ visible: false, tipo: 'categoria' })}>
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.addBtnSmall} onPress={onAdd}>
          <Text style={styles.addBtnSmallText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F0E8DF' },
  scroll:  { flex: 1 },
  content: { padding: 20 },

  // ── Sección ───────────────────────────────────────────────
  section: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  addBtnSmall: {
    backgroundColor: colors.wine,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnSmallText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.paper,
  },

  // ── Items ─────────────────────────────────────────────────
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  itemExpand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  itemNombre: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
  expandIcon: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: colors.muted,
  },
  itemActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editBtn: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.gold,
    marginLeft: 8,
  },
  editBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.wine,
  },
  toggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  inactivo: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.muted,
  },
  comisionText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.gold,
    marginTop: 3,
  },

  // ── Tallas ────────────────────────────────────────────────
  tallasWrap: {
    backgroundColor: colors.sand,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tallasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tallasTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  tallaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tallaValor: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // ── Modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44,26,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  fieldHint: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.input,
    padding: 14,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 14,
  },
  modalBtnPrimary: {
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnPrimaryText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.paper,
    fontSize: 14,
  },
  modalBtnDelete: {
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnDeleteText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.wine,
    fontSize: 14,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontFamily: fonts.sansMedium,
    color: colors.muted,
    fontSize: 14,
  },
});

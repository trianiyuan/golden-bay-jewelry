// app/settings.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Header } from '../components/ui/Header';
import { COLORS, SIZES } from '../constants/colors';
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
    setModal({ visible: true, tipo, item, parentId, parentNombre });
  }

  async function guardar() {
    if (!inputNombre.trim()) return;
    setSaving(true);
    try {
      const { tipo, item, parentId } = modal;

      if (tipo === 'categoria') {
        if (item) {
          await supabase.from('categorias').update({ nombre: inputNombre.trim() }).eq('id', item.id);
        } else {
          await supabase.from('categorias').insert({ nombre: inputNombre.trim(), unidad: 'unidad' });
        }
      } else if (tipo === 'canal') {
        if (item) {
          await supabase.from('canales_venta').update({ nombre: inputNombre.trim(), comision_porcentaje: parseFloat(inputComision) || 0 }).eq('id', item.id);
        } else {
          await supabase.from('canales_venta').insert({ nombre: inputNombre.trim(), activo: true, es_editable: true, comision_porcentaje: parseFloat(inputComision) || 0 });
        }
      } else if (tipo === 'gasto') {
        if (item) {
          await supabase.from('categorias_gasto').update({ nombre: inputNombre.trim() }).eq('id', item.id);
        } else {
          await supabase.from('categorias_gasto').insert({ nombre: inputNombre.trim(), es_editable: true });
        }
      } else if (tipo === 'talla' && parentId) {
        if (item) {
          await supabase.from('tallas_por_categoria').update({ valor: inputNombre.trim() }).eq('id', item.id);
        } else {
          const tallasCat = tallasPorCat[parentId] || [];
          await supabase.from('tallas_por_categoria').insert({
            categoria_id: parentId,
            valor: inputNombre.trim(),
            orden: tallasCat.length + 1,
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
      if (tipo === 'categoria') await supabase.from('categorias').delete().eq('id', item!.id);
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
        <ActivityIndicator color={COLORS.wine} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header showBack title="Configuración" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CATEGORÍAS</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => abrirModal('categoria')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
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
                <View style={styles.tallasContainer}>
                  <View style={styles.tallasHeader}>
                    <Text style={styles.tallasTitle}>Tallas de {cat.nombre}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => abrirModal('talla', undefined, cat.id, cat.nombre)}>
                      <Text style={styles.addBtnText}>+ Talla</Text>
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CANALES DE VENTA</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => abrirModal('canal')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {canales.map(canal => (
            <View key={canal.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemNombre, !canal.activo && { color: COLORS.textMuted }]}>
                  {canal.nombre}
                  {!canal.activo && <Text style={styles.inactivo}> (inactivo)</Text>}
                </Text>
                {canal.comision_porcentaje > 0 && (
                  <Text style={styles.comisionBadge}>Comisión: {canal.comision_porcentaje}%</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => toggleCanal(canal)} style={styles.toggleBtn}>
                  <Text style={[styles.toggleText, { color: canal.activo ? COLORS.textMuted : COLORS.wine }]}>
                    {canal.activo ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => abrirModal('canal', canal)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CATEGORÍAS DE GASTO</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => abrirModal('gasto')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {categoriasGasto.map(g => (
            <View key={g.id} style={styles.item}>
              <Text style={styles.itemNombre}>{g.nombre}</Text>
              <TouchableOpacity onPress={() => abrirModal('gasto', g)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modal.item ? 'Editar' : 'Agregar'}{' '}
              {modal.tipo === 'categoria' ? 'categoría' :
               modal.tipo === 'canal' ? 'canal de venta' :
               modal.tipo === 'gasto' ? 'categoría de gasto' :
               `talla — ${modal.parentNombre}`}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputNombre}
              onChangeText={setInputNombre}
              placeholder="Nombre..."
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            {modal.tipo === 'canal' && (
              <>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: '500' }}>
                  COMISIÓN DEL CANAL (%)
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
                  Si el canal cobra una comisión sobre la venta, ingresá el porcentaje. Dejá 0 si no aplica.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={inputComision}
                  onChangeText={setInputComision}
                  placeholder="Ej: 30"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </>
            )}
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={guardar} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#FFF1ED" size="small" />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SIZES.lg },
  section: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8 },
  addBtn: { backgroundColor: COLORS.wine, borderRadius: SIZES.radiusSm, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText: { fontSize: 12, color: '#FFF1ED', fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemExpand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  itemNombre: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  expandIcon: { fontSize: 10, color: COLORS.textMuted },
  itemActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: SIZES.radiusSm, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border, marginLeft: 8 },
  editBtnText: { fontSize: 12, color: COLORS.wine, fontWeight: '500' },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  toggleText: { fontSize: 12, fontWeight: '500' },
  inactivo: { fontSize: 12, color: COLORS.textMuted },
  comisionBadge: { fontSize: 11, color: COLORS.wine, marginTop: 2 },
  tallasContainer: { backgroundColor: '#FFF8F5', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tallasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tallasTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tallaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tallaValor: { fontSize: 13, color: COLORS.textPrimary },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,10,10,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: '#FFF1ED', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: '#E8C8B8' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMd, padding: 12, fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 },
  modalBtnPrimary: { backgroundColor: COLORS.wine, borderRadius: SIZES.radiusMd, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  modalBtnPrimaryText: { color: '#FFF1ED', fontSize: 14, fontWeight: '600' },
  modalBtnDelete: { borderWidth: 1, borderColor: '#E8C8B8', borderRadius: SIZES.radiusMd, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  modalBtnDeleteText: { color: COLORS.wine, fontSize: 14, fontWeight: '500' },
  modalBtnCancel: { paddingVertical: 12, alignItems: 'center' },
  modalBtnCancelText: { color: COLORS.textMuted, fontSize: 14 },
});
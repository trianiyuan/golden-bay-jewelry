// lib/queries/products.ts
import { supabase } from '../supabase';
import { Producto } from '../../types';

export async function getProductos(filtros?: {
  categoria_id?: string;
  color?: string;
  stock_bajo?: boolean;
  activo?: boolean;
}) {
  let query = supabase
    .from('productos')
    .select(`*, categoria:categorias(*), talla:tallas_por_categoria(*)`)
    .order('created_at', { ascending: false });

  if (filtros?.categoria_id) query = query.eq('categoria_id', filtros.categoria_id);
  if (filtros?.color) query = query.eq('color', filtros.color);
  if (filtros?.stock_bajo) query = query.lt('cantidad', 3);
  if (filtros?.activo !== undefined) query = query.eq('activo', filtros.activo);
  else query = query.eq('activo', true);

  const { data, error } = await query;
  if (error) throw error;
  return data as Producto[];
}

export async function getProductoById(id: string) {
  const { data, error } = await supabase
    .from('productos')
    .select(`*, categoria:categorias(*), talla:tallas_por_categoria(*)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Producto;
}

export async function getProductosStockBajo(umbral = 3) {
  const { data, error } = await supabase
    .from('productos')
    .select(`*, categoria:categorias(*), talla:tallas_por_categoria(*)`)
    .eq('activo', true)
    .lt('cantidad', umbral)
    .order('cantidad', { ascending: true });
  if (error) throw error;
  return data as Producto[];
}

export async function createProducto(producto: {
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  precio_costo: number;
  cantidad: number;
  categoria_id: string;
  talla_id: string;
  color: string;
  activo: boolean;
  imagen_url?: string;
}) {
  const { data, error } = await supabase
    .from('productos')
    .insert(producto)
    .select()
    .single();
  if (error) throw error;
  return data as Producto;
}

export async function updateProducto(id: string, updates: Partial<Producto>) {
  const { data, error } = await supabase
    .from('productos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Producto;
}

export async function archivarProducto(id: string) {
  return updateProducto(id, { activo: false });
}

export async function ajustarStock(productoId: string, cantidad: number, motivo: string) {
  const { error } = await supabase.rpc('ajustar_stock', {
    p_producto_id: productoId,
    p_cantidad: cantidad,
    p_motivo: motivo,
  });
  if (error) throw error;
}

export async function uploadImagenProducto(productoId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `productos/${productoId}.jpg`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function getCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function getTallasPorCategoria(categoriaId: string) {
  const { data, error } = await supabase
    .from('tallas_por_categoria')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('orden');
  if (error) throw error;
  return data;
}

export async function getCanalesVenta() {
  const { data, error } = await supabase
    .from('canales_venta')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data;
}

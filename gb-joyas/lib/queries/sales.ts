// lib/queries/sales.ts
import { supabase } from '../supabase';
import { Venta, ItemCarrito } from '../../types';

export async function getVentas(mes?: Date) {
  let query = supabase
    .from('ventas')
    .select(`*, canal_venta:canales_venta(*), productos:ventas_productos(*, producto:productos(*, categoria:categorias(*), talla:tallas_por_categoria(*)))`)
    .order('fecha', { ascending: false });

  if (mes) {
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString();
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString();
    query = query.gte('fecha', inicio).lte('fecha', fin);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Venta[];
}

export async function registrarVenta(params: {
  cliente_nombre: string;
  notas?: string;
  metodo_entrega: 'correos_cr' | 'retiro_personal';
  costo_envio: number;
  total_recibido: number;
  carrito: ItemCarrito[];
  canal_venta_id?: string;
  comision_porcentaje?: number;
  fecha?: string;
}) {
  const totalProductos = params.carrito.reduce(
    (sum, item) => sum + (item.producto.precio_venta || (item.producto as any).precio || 0) * item.cantidad, 0
  );
  const subtotal = totalProductos + params.costo_envio;
  const montoComision = params.comision_porcentaje ? Math.round(subtotal * (params.comision_porcentaje / 100)) : 0;
  const totalCobrado = subtotal + montoComision;

  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      cliente_nombre: params.cliente_nombre,
      notas: params.notas || null,
      metodo_entrega: params.metodo_entrega,
      costo_envio_cobrado: params.costo_envio,
      total_cobrado: totalCobrado,
      total_recibido: params.total_recibido,
      canal_venta_id: params.canal_venta_id || null,
      fecha: params.fecha ? `${params.fecha}T18:00:00.000Z` : new Date().toISOString(),
    })
    .select()
    .single();

  if (ventaError) throw ventaError;

  const ventaProductos = params.carrito.map(item => ({
    venta_id: venta.id,
    producto_id: item.producto.id,
    cantidad: item.cantidad,
    precio_unitario: item.producto.precio_venta || (item.producto as any).precio || 0,
    costo_unitario: (item.producto as any).precio_costo || 0,
  }));

  const { error: vpError } = await supabase.from('ventas_productos').insert(ventaProductos);
  if (vpError) throw vpError;

  // Descontar stock
  for (const item of params.carrito) {
    const { error: stockError } = await supabase.rpc('ajustar_stock', {
  p_producto_id: item.producto.id,
  p_cantidad: -item.cantidad,
  p_motivo: 'Venta',
  p_venta_id: venta.id,
});
if (stockError) throw stockError;
  }

  return venta.id;
}

export async function updateVenta(id: string, datos: {
  cliente_nombre?: string;
  notas?: string;
  total_recibido?: number;
  canal_venta_id?: string;
  metodo_entrega?: 'correos_cr' | 'retiro_personal';
}) {
  const { error } = await supabase
    .from('ventas')
    .update(datos)
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarVenta(id: string) {
  // 1. Eliminar movimientos de inventario relacionados
  await supabase
    .from('movimientos_inventario')
    .delete()
    .eq('venta_id', id);

  // 2. Eliminar productos de la venta
  await supabase
    .from('ventas_productos')
    .delete()
    .eq('venta_id', id);

  // 3. Eliminar la venta
  const { error } = await supabase
    .from('ventas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// lib/queries/expenses.ts
export async function getGastos(mes?: Date) {
  let query = supabase
    .from('gastos')
    .select(`*, categoria:categorias_gasto(*)`)
    .order('fecha', { ascending: false });

  if (mes) {
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString().split('T')[0];
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString().split('T')[0];
    query = query.gte('fecha', inicio).lte('fecha', fin);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createGasto(gasto: {
  fecha: string;
  monto: number;
  categoria_gasto_id: string;
  notas?: string;
}) {
  const { data, error } = await supabase
    .from('gastos')
    .insert(gasto)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGasto(id: string, datos: {
  monto?: number;
  notas?: string;
  categoria_gasto_id?: string;
  fecha?: string;
}) {
  const { error } = await supabase
    .from('gastos')
    .update(datos)
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarGasto(id: string) {
  const { error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getCategoriasGasto() {
  const { data, error } = await supabase
    .from('categorias_gasto')
    .select('*')
    .order('nombre');
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

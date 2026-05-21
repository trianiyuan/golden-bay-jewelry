// lib/queries/finances.ts
import { supabase } from '../supabase';
import { ResumenMes } from '../../types';

export async function getResumenMes(año: number, mes: number): Promise<ResumenMes> {
  const inicio = new Date(año, mes, 1).toISOString();
  const fin = new Date(año, mes + 1, 0, 23, 59, 59).toISOString();
  const inicioDate = new Date(año, mes, 1).toISOString().split('T')[0];
  const finDate = new Date(año, mes + 1, 0).toISOString().split('T')[0];

  const { data: ventas } = await supabase
    .from('ventas')
    .select('id, total_cobrado')
    .gte('fecha', inicio)
    .lte('fecha', fin);

  const ventaIds = (ventas || []).map(v => v.id);
  const ingresos = (ventas || []).reduce((sum, v) => sum + Number(v.total_cobrado), 0);

  let cogs = 0;
  if (ventaIds.length > 0) {
    const { data: items } = await supabase
      .from('ventas_productos')
      .select('cantidad, costo_unitario')
      .in('venta_id', ventaIds);
    cogs = (items || []).reduce((sum, i) => sum + (Number(i.costo_unitario) * Number(i.cantidad)), 0);
  }

  const { data: gastos } = await supabase
    .from('gastos')
    .select('monto')
    .gte('fecha', inicioDate)
    .lte('fecha', finDate);

  const totalGastos = (gastos || []).reduce((sum, g) => sum + Number(g.monto), 0);

  const { data: productos } = await supabase
    .from('productos')
    .select('cantidad, precio_costo')
    .eq('activo', true);
  const valorInventario = (productos || []).reduce(
    (sum, p) => sum + (Number(p.precio_costo) * Number(p.cantidad)), 0
  );

  return {
    mes: `${año}-${String(mes + 1).padStart(2, '0')}`,
    total_ventas: ventas?.length || 0,
    ingresos_ventas: ingresos,
    cogs,
    ganancia_bruta: ingresos - cogs,
    total_gastos: totalGastos,
    ganancia: ingresos - cogs - totalGastos,
    valor_inventario: valorInventario,
  };
}

export async function getResumenUltimosMeses(cantMeses = 6) {
  const hoy = new Date();
  const meses = Array.from({ length: cantMeses }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (cantMeses - 1 - i), 1);
    return { año: fecha.getFullYear(), mes: fecha.getMonth() };
  });

  const resultados = await Promise.all(
    meses.map(({ año, mes }) => getResumenMes(año, mes))
  );

  return resultados;
}

export async function getGastosPorCategoria(año: number, mes: number) {
  const inicio = new Date(año, mes, 1).toISOString().split('T')[0];
  const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('gastos')
    .select(`monto, categoria:categorias_gasto(nombre)`)
    .gte('fecha', inicio)
    .lte('fecha', fin);

  if (error) throw error;

  const agrupado: Record<string, number> = {};
  (data || []).forEach((g: any) => {
    const nombre = g.categoria?.nombre || 'Otros';
    agrupado[nombre] = (agrupado[nombre] || 0) + Number(g.monto);
  });

  return Object.entries(agrupado).map(([nombre, total]) => ({ nombre, total }));
}
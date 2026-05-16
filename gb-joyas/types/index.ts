// types/index.ts

export interface Categoria {
  id: string;
  nombre: string;
  unidad: 'unidad' | 'par';
  icono?: string;
  created_at: string;
}

export interface TallaPorCategoria {
  id: string;
  categoria_id: string;
  valor: string;
  orden: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  talla_id: string;
  color: 'dorado' | 'plateado' | 'rose_gold';
  descripcion?: string;
  cantidad: number;
  precio: number;
  precio_venta: number;
  precio_costo: number;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: Categoria;
  talla?: TallaPorCategoria;
}

export interface Venta {
  id: string;
  fecha: string;
  cliente_nombre: string;
  notas?: string;
  total_productos: number;
  costo_envio_cobrado: number;
  total_cobrado: number;
  total_recibido: number;
  metodo_entrega: 'correos_cr' | 'retiro_personal';
  created_at: string;
  productos?: VentaProducto[];
}

export interface VentaProducto {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  producto?: Producto;
}

export interface CategoriaGasto {
  id: string;
  nombre: string;
  es_editable: boolean;
}

export interface Gasto {
  id: string;
  fecha: string;
  monto: number;
  categoria_gasto_id: string;
  notas?: string;
  created_at: string;
  categoria?: CategoriaGasto;
}

export interface MovimientoInventario {
  id: string;
  producto_id: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  venta_id?: string;
  created_at: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface ResumenMes {
  mes: string;
  total_ventas: number;
  ingresos_ventas: number;
  cogs: number;
  ganancia_bruta: number;
  total_gastos: number;
  ganancia: number;
  valor_inventario: number;
}
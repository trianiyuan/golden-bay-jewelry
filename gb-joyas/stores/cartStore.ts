// stores/cartStore.ts
import { create } from 'zustand';
import { Producto, ItemCarrito } from '../types';

interface CartStore {
  carrito: ItemCarrito[];
  agregarProducto: (producto: Producto) => void;
  quitarProducto: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  limpiarCarrito: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  carrito: [],

  agregarProducto: (producto) => {
    const { carrito } = get();
    const existe = carrito.find(i => i.producto.id === producto.id);
    if (existe) {
      set({ carrito: carrito.map(i =>
        i.producto.id === producto.id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      )});
    } else {
      set({ carrito: [...carrito, { producto, cantidad: 1 }] });
    }
  },

  quitarProducto: (productoId) =>
    set(s => ({ carrito: s.carrito.filter(i => i.producto.id !== productoId) })),

  cambiarCantidad: (productoId, cantidad) => {
    if (cantidad <= 0) {
      get().quitarProducto(productoId);
      return;
    }
    set(s => ({ carrito: s.carrito.map(i =>
      i.producto.id === productoId ? { ...i, cantidad } : i
    )}));
  },

  limpiarCarrito: () => set({ carrito: [] }),

  total: () => get().carrito.reduce((sum, i) => sum + (i.producto.precio_venta || (i.producto as any).precio || 0) * i.cantidad, 0),
}));

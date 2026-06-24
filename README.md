# 💍 Golden Bay Jewelry App

> Sistema de gestión de inventario, ventas y finanzas desarrollado a medida para una joyería costarricense.

**🌐 Live Demo:** [golden-bay-jewelry.vercel.app](https://golden-bay-jewelry.vercel.app)

```
Demo login:
Email:    demo@goldenbayjewelry.com
Password: Demo1234!
```

---

## 📌 Sobre el proyecto

La clienta manejaba su negocio con hojas de cálculo y notas manuales. No tenía visibilidad clara de sus ganancias reales después de descontar comisiones por canal de venta ni costos fijos mensuales.

Esta app resuelve eso con una solución web completa, responsiva y accesible desde cualquier dispositivo.

---

## ✨ Features principales

- **Dashboard financiero** con KPIs en tiempo real (margen bruto, margen neto, ticket promedio)
- **Inventario** con fotos de productos, control de stock y categorías
- **Registro de ventas** con cálculo automático de comisiones por canal
- **Gestión de gastos** con categorías personalizables
- **Reportes PDF** mensuales y anuales generados con un clic
- **Sistema de canales de venta** con comisión porcentual y costo fijo mensual
- **Autenticación** segura con Supabase Auth
- **Row Level Security** activo en todas las tablas

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo (web) |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel |
| Tipado | TypeScript |
| Estilos | NativeWind (Tailwind) + tema personalizado |
| Fuentes | Cormorant Garamond + Hanken Grotesk |

---

## 🗄 Estructura de base de datos

```
canales_venta     → canales de venta con comisión y costo fijo
categorias        → categorías de productos (anillos, aretes, etc.)
categorias_gasto  → categorías de gastos
productos         → inventario con fotos, tallas, colores
tallas_por_categoria → tallas disponibles por categoría
ventas            → registro de ventas
ventas_productos  → productos incluidos en cada venta
gastos            → gastos del negocio
movimientos_inventario → entradas y salidas de stock
```

---

## 🚀 Correr localmente

```bash
git clone https://github.com/trianiyuan/golden-bay-jewelry.git
cd golden-bay-jewelry/gb-joyas

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env.local
# Agrega tus credenciales de Supabase en .env.local

# Correr en web
npm run web
```

---

## 📁 Estructura del proyecto

```
app/
├── (auth)/        → pantalla de login
├── (tabs)/        → navegación principal
│   ├── index      → dashboard
│   ├── inventory  → inventario
│   ├── sales      → ventas
│   ├── expenses   → gastos
│   └── finances   → finanzas y reportes PDF
components/        → componentes reutilizables
constants/         → tema, colores, tipografía
lib/               → cliente de Supabase
stores/            → estado global con Zustand
types/             → tipos TypeScript
```

---

## 👩‍💻 Desarrollado por

**Triani Yuan** · [github.com/trianiyuan](https://github.com/trianiyuan)

> Proyecto real entregado a cliente. Este repo contiene una versión demo con datos ficticios.

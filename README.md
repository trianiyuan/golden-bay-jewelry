# GB Joyas — App de Inventario

App de gestión de inventario para joyería. Construida con Expo + React Native + Supabase.

## Stack

- **Expo SDK 51** + Expo Router v3 (web + iOS desde un solo código)
- **Supabase** — base de datos, auth e imágenes
- **Zustand** — estado global
- **React Hook Form** — formularios
- **TypeScript** — tipos en toda la app

## Cómo arrancar

### 1. Clonar e instalar dependencias
```bash
git clone <repo>
cd gb-joyas
npm install
```

### 2. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el archivo `supabase/migrations/001_initial_schema.sql`
3. Copiar `.env.example` a `.env.local` y pegar tu URL y anon key

```bash
cp .env.example .env.local
```

### 3. Crear usuario en Supabase
En el dashboard de Supabase → Authentication → Users → Add user

### 4. Correr la app
```bash
# Web
npm run web

# iOS (necesita Mac + Xcode)
npm run ios
```

## Estructura de carpetas

```
app/
  (tabs)/         → Pantallas principales (Dashboard, Inventario, Ventas, Gastos, Finanzas)
  auth/           → Login
  product/        → Detalle y formulario de producto
  sale/           → Nueva venta
  expense/        → Nuevo gasto
components/
  ui/             → Botones, cards, inputs reutilizables
  inventory/      → Componentes del inventario
  dashboard/      → Componentes del dashboard
  finances/       → Gráficos financieros
lib/
  supabase.ts     → Cliente Supabase
  queries/        → Todas las queries a la base de datos
stores/           → Estado global (Zustand)
types/            → Interfaces TypeScript
constants/        → Colores, fuentes, tamaños
supabase/
  migrations/     → SQL del schema de la base de datos
```

## Paleta de colores

| Variable | Hex | Uso |
|----------|-----|-----|
| `wine` | `#7A2340` | Botones primarios, tabs activos |
| `blush` | `#F2C4B0` | Cards accent, avatares |
| `peach` | `#E8A898` | Elementos secundarios |
| `background` | `#FAF0EC` | Fondo principal |
| `surface` | `#FDF7F5` | Cards y componentes |
| `border` | `#E0C0B8` | Bordes de todos los componentes |

Todos los colores están en `constants/colors.ts` — un solo cambio ahí se aplica en toda la app.

## Deploy web (Vercel)

1. Subir el repo a GitHub
2. Conectar Vercel al repo
3. Build command: `npx expo export --platform web`
4. Output dir: `dist`
5. Agregar variables de entorno en Vercel

## Build iOS (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

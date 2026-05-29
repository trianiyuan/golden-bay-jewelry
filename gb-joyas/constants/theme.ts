/**
 * Golden Bay Jewelry — Boutique Theme
 * Archivo: constants/theme.ts
 *
 * Uso:
 *   import { colors, typography, radius, shared } from '@/constants/theme';
 *
 * Fuentes (agregar en app/_layout.tsx o App.tsx):
 *   import { useFonts } from 'expo-font';
 *   const [loaded] = useFonts({
 *     'CormorantGaramond-Regular':  require('../assets/fonts/CormorantGaramond-Regular.ttf'),
 *     'CormorantGaramond-Medium':   require('../assets/fonts/CormorantGaramond-Medium.ttf'),
 *     'CormorantGaramond-SemiBold': require('../assets/fonts/CormorantGaramond-SemiBold.ttf'),
 *     'CormorantGaramond-Bold':     require('../assets/fonts/CormorantGaramond-Bold.ttf'),
 *     'CormorantGaramond-Italic':   require('../assets/fonts/CormorantGaramond-Italic.ttf'),
 *     'HankenGrotesk-Regular':      require('../assets/fonts/HankenGrotesk-Regular.ttf'),
 *     'HankenGrotesk-Medium':       require('../assets/fonts/HankenGrotesk-Medium.ttf'),
 *     'HankenGrotesk-SemiBold':     require('../assets/fonts/HankenGrotesk-SemiBold.ttf'),
 *     'HankenGrotesk-Bold':         require('../assets/fonts/HankenGrotesk-Bold.ttf'),
 *   });
 *
 * Descarga las fuentes desde Google Fonts y ponlas en assets/fonts/
 * https://fonts.google.com/specimen/Cormorant+Garamond
 * https://fonts.google.com/specimen/Hanken+Grotesk
 */

import { StyleSheet, Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// COLORES
// ─────────────────────────────────────────────────────────────
export const colors = {
  // superficies
  sand:       '#E8D2B9',   // fondo general de la app
  cream:      '#FFFCFA',   // fondo de cards y paneles
  paper:      '#FFFFFF',   // inputs, fondos puros

  // marca / vino
  wine:       '#5A1B2B',   // primario: CTAs, tabs activos, títulos
  wine2:      '#7A2A3C',   // vino claro (gradientes, avatares)
  wineInk:    '#3F1320',   // vino oscuro (gradientes profundos)

  // acentos
  coral:      '#E0A091',
  coralSoft:  '#F2CFC6',
  coralBg:    '#FBE9E3',   // fondo chips / badges suaves

  // dorado
  gold:       '#BE955A',
  goldSoft:   '#E2C49A',   // dorado claro sobre vino
  goldLine:   'rgba(190,149,90,0.5)',  // filetes y bordes

  // texto
  ink:        '#2C1A1C',   // texto principal
  muted:      '#9C7C79',   // texto secundario
  muted2:     '#B79A95',   // placeholders / terciario

  // líneas
  line:       'rgba(90,27,43,0.10)',
  lineStrong: 'rgba(90,27,43,0.16)',

  // semánticos
  chipFeriaText:  '#8A6420',
  chipFeriaBg:    '#F3E7CF',
  chipTiktokText: '#7A2A3C',
  chipTiktokBg:   '#F0DBD8',
  stockText:      '#8A6420',
  stockBg:        '#F3E7CF',

  // materiales
  oro:      '#C9A24A',
  plata:    '#C4C4CA',
  oreRosa:  '#E0A091',

  // overlay
  heroFrame: 'rgba(226,196,154,0.28)',
  white:     '#FFFFFF',
  transparent: 'transparent',
} as const;

// ─────────────────────────────────────────────────────────────
// FAMILIAS DE FUENTES
// (Usá estos strings como fontFamily en tus estilos)
// ─────────────────────────────────────────────────────────────
export const fonts = {
  // Cormorant Garamond → números, títulos, montos, notas
  serifRegular:  'CormorantGaramond-Regular',
  serifMedium:   'CormorantGaramond-Medium',
  serifSemiBold: 'CormorantGaramond-SemiBold',
  serifBold:     'CormorantGaramond-Bold',
  serifItalic:   'CormorantGaramond-Italic',

  // Hanken Grotesk → UI, labels, botones, metadatos, nav
  sansRegular:   'HankenGrotesk-Regular',
  sansMedium:    'HankenGrotesk-Medium',
  sansSemiBold:  'HankenGrotesk-SemiBold',
  sansBold:      'HankenGrotesk-Bold',
} as const;

// ─────────────────────────────────────────────────────────────
// TIPOGRAFÍA
// Regla: serif (Cormorant) para números y títulos
//        sans  (Hanken)    para UI y texto funcional
// ─────────────────────────────────────────────────────────────
export const typography = StyleSheet.create({
  // ── Títulos de pantalla ──────────────────────────────────
  pageTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 34,
    color: colors.wine,
    lineHeight: 36,
  },
  formTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 27,
    color: colors.ink,
    textAlign: 'center',
  },

  // ── Números héroe / grandes ──────────────────────────────
  heroAmount: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 64,
    color: '#FBEFE6',
    lineHeight: 60,
    letterSpacing: -0.8,
  },
  metricValue: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 44,
    color: colors.ink,
    lineHeight: 44,
  },
  metricValueWine: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 44,
    color: colors.wine,
    lineHeight: 44,
  },

  // ── Montos en listas / precios ───────────────────────────
  saleAmount: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  productPrice: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    color: colors.ink,
  },
  summaryTotal: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 30,
    color: '#FBEFE6',
  },
  calcResult: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 25,
    color: colors.wine,
  },
  monthLabel: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 19,
    color: colors.ink,
  },

  // ── Nota de venta (itálica) ──────────────────────────────
  saleNote: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.wine2,
  },

  // ── Wordmark ─────────────────────────────────────────────
  wordmarkName: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 24,
    color: colors.wine,
    letterSpacing: 0.2,
  },
  wordmarkSub: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── UI / Hanken ──────────────────────────────────────────
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  labelGold: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.goldSoft,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  navItem: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
  },
  bodySemiBold: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  meta: {
    fontFamily: fonts.sansRegular,
    fontSize: 12.5,
    color: colors.muted,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  btnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.white,
    textAlign: 'center',
  },
  btnTextGhost: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.wine,
    textAlign: 'center',
  },
  inputNumeric: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    color: colors.ink,
  },
  inputText: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.ink,
  },
  placeholder: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.muted2,
  },
  backLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.wine,
  },
});

// ─────────────────────────────────────────────────────────────
// ESPACIADO Y RADIOS
// ─────────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 40,
} as const;

export const radius = {
  pill:   100,
  hero:   20,
  card:   16,
  button: 12,
  input:  12,
  avatar: 12,  // cuadrado redondeado
  chip:   100,
  method: 14,
  iconBtn: 9,
} as const;

// ─────────────────────────────────────────────────────────────
// SOMBRAS (mínimas — el sistema usa bordes hairline, no sombras)
// ─────────────────────────────────────────────────────────────
export const shadows = {
  none: {},
  subtle: Platform.select({
    ios: {
      shadowColor: colors.wine,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }),
} as const;

// ─────────────────────────────────────────────────────────────
// ESTILOS DE COMPONENTES COMPARTIDOS
// ─────────────────────────────────────────────────────────────
export const shared = StyleSheet.create({

  // ── Contenedor general de pantalla ──────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  pageCanvas: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // espacio para el bottom nav
  },

  // ── Header de marca ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.sand,
  },
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrap: {
    alignItems: 'center',
  },

  // ── Cards / Panels ───────────────────────────────────────
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 20,
  },
  cardAccent: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 20,
    overflow: 'hidden',
  },
  // Barra dorada superior (usala como View dentro de cardAccent)
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.7,
    borderRadius: 2,
  },

  // ── Hero panel vino ──────────────────────────────────────
  heroPanelWine: {
    borderRadius: radius.hero,
    padding: 28,
    overflow: 'hidden',
    backgroundColor: colors.wineInk, // fallback; el gradiente va en el componente
  },
  // Marco dorado interior del hero (View absoluta)
  heroFrame: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,196,154,0.28)',
    borderRadius: 12,
    pointerEvents: 'none',
  },

  // ── Strip / Summary vino (ventas) ────────────────────────
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 14,
    overflow: 'hidden',
    backgroundColor: colors.wineInk, // fallback; gradiente en componente
  },
  summaryFrame: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(226,196,154,0.26)',
    borderRadius: 9,
    pointerEvents: 'none',
  },

  // ── Métricas (tiles) ─────────────────────────────────────
  metricCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 18,
    overflow: 'hidden',
  },
  metricAccentBar: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.7,
  },

  // ── Botones ──────────────────────────────────────────────
  btnWine: {
    backgroundColor: colors.wine,
    borderRadius: radius.button,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWineCompact: {
    backgroundColor: colors.wine,
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSave: {
    backgroundColor: colors.wine,
    borderRadius: 13,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.iconBtn,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    width: 34,
    height: 34,
    borderRadius: radius.iconBtn,
    borderWidth: 1,
    borderColor: 'rgba(90,27,43,0.2)',
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Avatar cuadrado ──────────────────────────────────────
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wine2, // gradiente en componente con LinearGradient
  },

  // ── Chips de canal ───────────────────────────────────────
  chip: {
    borderRadius: radius.chip,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  chipDirecta: {
    backgroundColor: colors.coralBg,
  },
  chipFeria: {
    backgroundColor: colors.chipFeriaBg,
  },
  chipTiktok: {
    backgroundColor: colors.chipTiktokBg,
  },

  // ── Fila de venta ────────────────────────────────────────
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  saleRowMain: {
    flex: 1,
    minWidth: 0,
  },
  saleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saleActions: {
    flexDirection: 'row',
    gap: 7,
  },

  // ── Navegación mes ───────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Inventario: card de producto ─────────────────────────
  productCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  productImgPlaceholder: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7E6E0', // fallback; el patrón diagonal va con SVG o imagen
  },
  productBody: {
    padding: 14,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stockBadge: {
    backgroundColor: colors.stockBg,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },

  // ── Pills de filtro (inventario / formularios) ───────────
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
  },
  filterPillActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.wine,
    backgroundColor: colors.wine,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
  },
  colorPillActive: {
    borderColor: colors.gold,
  },
  colorDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  // ── Selector pill (forms: categoría / color / canal) ─────
  selectorPill: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorPillActive: {
    backgroundColor: colors.wine,
    borderColor: colors.wine,
  },

  // ── Formulario ───────────────────────────────────────────
  formPage: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  formBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 22,
  },
  formInput: {
    width: '100%',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    fontFamily: 'HankenGrotesk-Regular',
  },
  formInputNumeric: {
    width: '100%',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: colors.ink,
    fontFamily: 'CormorantGaramond-SemiBold',
  },
  formInputFocused: {
    borderColor: 'rgba(190,149,90,0.5)',
  },
  formFooter: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },

  // Pasos del form
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coralSoft,
  },
  stepDotActive: {
    backgroundColor: colors.wine,
  },

  // Zona de foto
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
  },
  photoBtn: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 4,
  },

  // Tarjeta de método de entrega
  deliveryMethod: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.method,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  deliveryMethodActive: {
    borderColor: colors.gold,
    backgroundColor: colors.coralBg,
  },

  // ── Bottom nav ───────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.sand,
  },
  navItemWrap: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 2,
  },

  // ── Monogram GB ──────────────────────────────────────────
  gbMonogram: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.transparent,
  },
});

// ─────────────────────────────────────────────────────────────
// GRADIENTES (para usar con expo-linear-gradient)
// import { LinearGradient } from 'expo-linear-gradient';
// ─────────────────────────────────────────────────────────────
export const gradients = {
  wine: {
    colors: ['#6A2233', '#5A1B2B', '#3F1320'] as const,
    start: { x: 0, y: 0 },
    end:   { x: 1, y: 1 },
    // Para el efecto radial dorado, agregá una View encima con opacity
    // background: radial gold overlay rgba(190,149,90,0.20)
  },
  avatar: {
    colors: ['#7A2A3C', '#5A1B2B'] as const,
    start: { x: 0.1, y: 0 },
    end:   { x: 1,   y: 1 },
  },
} as const;

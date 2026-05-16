// constants/colors.ts
// Official Golden Bay Jewelry brand palette

export const COLORS = {
  // Backgrounds
  background: '#FFF1ED',     // Peonía — main background
  surface: '#FFFFFF',        // white for cards
  surfaceAlt: '#EDD3B9',     // Arena — chips, search bar
  hover: '#E8C8B8',          // slightly darker Arena for hover

  // Brand — Golden Bay
  wine: '#622632',           // Vino Tinto — primary buttons, active tabs
  wineHover: '#7A2F3D',      // Vino Tinto hover
  lipGloss: '#8F4450',       // Lip Gloss — secondary accent
  blush: '#ECABA0',          // Sal Rosa — accent cards, avatars
  peach: '#ECABA0',          // alias
  rose: '#EDD3B9',           // Arena — stock ok badges, bar tracks
  cream: '#FFF1ED',          // Peonía

  // Borders
  border: '#E8C8B8',

  // Text
  textPrimary: '#1A0A0A',
  textMuted: '#7A4A48',
  textLight: '#C4908A',

  // Jewelry color dots
  gold: '#D4AF37',
  silver: '#C0C0C0',
  roseGold: '#ECABA0',

  // Stock states
  stockLow: '#622632',
  stockLowText: '#FFF1ED',
  stockOk: '#EDD3B9',
  stockOkText: '#1A0A0A',

  // Validation
  error: '#C0392B',
  errorLight: '#FDECEA',
} as const;

export const FONTS = {
  serif: 'serif',
  sans: 'system',
} as const;

export const SIZES = {
  // Border radius
  radiusSm: 8,
  radiusMd: 10,
  radiusLg: 12,
  radiusXl: 16,
  radiusFull: 999,

  // Spacing
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  // Typography
  textXs: 10,
  textSm: 11,
  textBase: 12,
  textMd: 13,
  textLg: 15,
  textXl: 17,
  textH2: 22,
  textH1: 28,
} as const;

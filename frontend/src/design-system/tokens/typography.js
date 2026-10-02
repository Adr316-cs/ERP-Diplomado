/**
 * S-TUN CODEX Design Tokens - Typography
 * Tipografía oficial: Outfit (Display & Títulos) / Geist Sans (UI & Textos)
 */
import { Platform } from 'react-native';

const fontFamilyDisplay = Platform.select({
  web: "'Outfit', 'Space Grotesk', system-ui, -apple-system, sans-serif",
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const fontFamilyUI = Platform.select({
  web: "'Geist Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  web: "'JetBrains Mono', 'Geist Mono', 'Fira Code', Consolas, Monaco, monospace",
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const TYPOGRAPHY = {
  fontFamily: {
    display: fontFamilyDisplay,
    ui: fontFamilyUI,
    mono: fontFamilyMono,
  },
  fontSize: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 36,
    display: 48,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.3,
    relaxed: 1.5,
  },
};

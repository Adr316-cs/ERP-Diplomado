import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../design-system/tokens';

/**
 * STunCodexLogoIcon - Emblema oficial en vector de S-TUN CODEX
 * Escudo pentagonal tecnológico con visera, núcleo pentagonal y detalles de circuito.
 */
export function STunCodexLogoIcon({ size = 40, style }) {
  const isWeb = Platform.OS === 'web';
  const scale = size / 40;

  if (isWeb) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Escudo Exterior Pentagonal */}
          <polygon
            points="50,5 92,32 82,88 18,88 8,32"
            fill="none"
            stroke="#00B4D8"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          {/* Anillo Pentagonal Medio */}
          <polygon
            points="50,16 82,37 74,80 26,80 18,37"
            fill="none"
            stroke="#3A7BD5"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Visera Tecnológica Central */}
          <polygon
            points="22,32 78,32 84,56 50,78 16,56"
            fill="#FFFFFF"
          />
          {/* Núcleo Pentagonal Oscuro */}
          <polygon
            points="50,38 68,48 61,65 39,65 32,48"
            fill="#050D1A"
            stroke="#00B4D8"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Circuitos Radiales */}
          <line x1="50" y1="38" x2="50" y2="32" stroke="#00B4D8" strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="48" x2="76" y2="48" stroke="#00B4D8" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="48" x2="24" y2="48" stroke="#00B4D8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </View>
    );
  }

  // Renderizado nativo móvil basado en geometría compuesta
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[styles.nativeShield, { width: size, height: size, borderRadius: size * 0.2 }]}>
        <View style={[styles.nativeVisor, { width: size * 0.7, height: size * 0.7 }]}>
          <View style={[styles.nativeCore, { width: size * 0.4, height: size * 0.4 }]}>
            <Text style={[styles.nativeCoreText, { fontSize: Math.max(10, Math.round(12 * scale)) }]}>S</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * STunCodexLogo - Logotipo completo oficial S-TUN CODEX (Lockup Horizontal / Vertical)
 */
export function STunCodexLogo({ size = 'md', showTag = true, layout = 'horizontal', style }) {
  const isLg = size === 'lg';
  const iconSize = isLg ? 48 : 36;

  return (
    <View style={[styles.logoContainer, layout === 'vertical' && styles.vertical, style]}>
      <STunCodexLogoIcon size={iconSize} />

      <View style={[styles.textGroup, layout === 'vertical' && styles.verticalTextGroup]}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.brandPrefix, isLg && styles.titleLg]}>S-Tun </Text>
          <Text style={[styles.brandSuffix, isLg && styles.titleLg]}>Codex</Text>
        </View>
        {showTag ? (
          <Text style={[styles.tagline, isLg && styles.taglineLg]}>INTELLIGENT ERP SOLUTIONS</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Native Shield Fallback
  nativeShield: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeVisor: {
    backgroundColor: COLORS.textWhite,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeCore: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeCoreText: {
    color: COLORS.accent,
    fontWeight: '900',
  },

  // Full Logo Layout
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vertical: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  textGroup: {
    justifyContent: 'center',
  },
  verticalTextGroup: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrefix: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.display,
    letterSpacing: -0.3,
  },
  brandSuffix: {
    color: COLORS.textWhite,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.display,
    letterSpacing: -0.3,
  },
  titleLg: {
    fontSize: 26,
  },
  tagline: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  taglineLg: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
});

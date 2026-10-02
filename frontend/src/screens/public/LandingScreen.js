import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../design-system/tokens';
import { TTBadge, TTButton, TTCard } from '../../design-system/components';
import { STunCodexLogo } from '../../components/STunCodexLogo';

/**
 * LandingScreen - Landing Page Pública S-TUN CODEX ERP
 */
export default function LandingScreen({ onGoLogin }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <STunCodexLogo size="md" />
        </View>

        <View style={styles.navLinks}>
          <Text style={styles.navLink}>Módulos</Text>
          <Text style={styles.navLink}>Soluciones</Text>
          <Text style={styles.navLink}>Tecnología</Text>
          <Text style={styles.navLink}>Empresa</Text>
        </View>

        <View style={styles.navActions}>
          <TTButton variant="ghost" size="sm" onPress={onGoLogin}>
            Iniciar Sesión
          </TTButton>
          <TTButton variant="primary" size="sm" onPress={onGoLogin}>
            Comenzar
          </TTButton>
        </View>
      </View>

      {/* HERO SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadgeBox}>
          <TTBadge value="active" label="S-TUN CODEX · INTELLIGENT ERP SOLUTIONS" variant="accent" />
        </View>

        <Text style={styles.heroTitle}>
          Tu empresa, en el <Text style={styles.heroHighlight}>siguiente nivel.</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          INTEGRA · AUTOMATIZA · CRECE. La plataforma inteligente para gestionar ventas, compras, inventarios, finanzas y operaciones.
        </Text>

        <View style={styles.heroCtaRow}>
          <TTButton variant="primary" size="lg" onPress={onGoLogin} style={styles.ctaMain}>
            Iniciar Sesión →
          </TTButton>
          <TTButton variant="secondary" size="lg" onPress={onGoLogin}>
            Conocer Módulos
          </TTButton>
        </View>

        {/* METRICAS DE CONFIANZA */}
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>99.99%</Text>
            <Text style={styles.trustLabel}>SLA Disponibilidad</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>Multi-tenant</Text>
            <Text style={styles.trustLabel}>Seguridad RBAC</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>22+</Text>
            <Text style={styles.trustLabel}>Módulos Integrados</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>100%</Text>
            <Text style={styles.trustLabel}>Trazabilidad en Vivo</Text>
          </View>
        </View>
      </View>

      {/* ECOSISTEMA SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionPre}>S-TUN CODEX ECOSISTEMA</Text>
        <Text style={styles.sectionTitle}>CONSTRUIDO PARA EL FUTURO</Text>
        <Text style={styles.sectionSub}>
          Arquitectura modular que conecta todas las áreas de tu empresa de forma transparente.
        </Text>

        <View style={styles.ecosystemGrid}>
          <TTCard title="⚡ CORE & AUDITORÍA" subtitle="Empresas & Permisos" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Control fino de usuarios, roles, sucursales y trazabilidad completa de cada acción.
            </Text>
          </TTCard>

          <TTCard title="📦 INVENTARIOS" subtitle="Multialmacén & Stock" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Kardex en tiempo real, conteos físicos, movimientos y alertas automáticas.
            </Text>
          </TTCard>

          <TTCard title="💰 FINANZAS" subtitle="Cuentas & Presupuestos" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Ingresos, egresos, presupuestos y balance en tiempo real por centro de costo.
            </Text>
          </TTCard>

          <TTCard title="🎯 CRM & PROYECTOS" subtitle="Leads & Seguimiento" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Gestión de clientes, oportunidades comerciales y avance de proyectos.
            </Text>
          </TTCard>

          <TTCard title="⚙️ PRODUCCIÓN" subtitle="Listas BOM & Trabajo" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Explosión de insumos de materiales (BOM) y consumo directo de órdenes.
            </Text>
          </TTCard>

          <TTCard title="👔 RECURSOS HUMANOS" subtitle="Empleados & Departamentos" style={styles.ecoCard}>
            <Text style={styles.ecoText}>
              Expedientes digitales de personal, cargos y administración de talento.
            </Text>
          </TTCard>
        </View>
      </View>

      {/* CTA FOOTER SECTION */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaPre}>S-TUN CODEX</Text>
        <Text style={styles.ctaTitle}>CONSTRUIDO PARA EL FUTURO</Text>
        <Text style={styles.ctaSub}>
          Transforma la operación de tu empresa con la mejor experiencia visual e intuitiva.
        </Text>

        <TTButton variant="primary" size="lg" onPress={onGoLogin} style={styles.ctaBtn}>
          Acceder al Sistema →
        </TTButton>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>S-TUN CODEX — INTELLIGENT ERP SOLUTIONS © 2026</Text>
        <Text style={styles.footerSub}>Todos los derechos reservados.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  navLinks: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  navLink: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    alignItems: 'center',
    textAlign: 'center',
    gap: SPACING.lg,
    maxWidth: 900,
    alignSelf: 'center',
  },
  heroBadgeBox: {
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.display,
    lineHeight: 46,
  },
  heroHighlight: {
    color: COLORS.accent,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 640,
    fontFamily: TYPOGRAPHY.fontFamily.ui,
    lineHeight: 26,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaMain: {
    minWidth: 180,
  },

  // Trust Grid
  trustGrid: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginTop: SPACING.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  trustItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 140,
  },
  trustNumber: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.accent,
    fontFamily: TYPOGRAPHY.fontFamily.display,
  },
  trustLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },

  // General Section
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    gap: SPACING.md,
  },
  sectionPre: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.display,
  },
  sectionSub: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },

  // Ecosystem Grid
  ecosystemGrid: {
    flexDirection: 'row',
    gap: SPACING.lg,
    flexWrap: 'wrap',
    marginTop: SPACING.lg,
  },
  ecoCard: {
    flex: 1,
    minWidth: 300,
  },
  ecoText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.md,
  },
  ctaPre: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
    letterSpacing: 1,
  },
  ctaTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.display,
  },
  ctaSub: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ctaBtn: {
    marginTop: SPACING.md,
    minWidth: 200,
  },

  // Footer
  footer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  footerBrand: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  footerSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});

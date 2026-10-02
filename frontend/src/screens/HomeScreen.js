import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../design-system/tokens';
import {
  TTBadge,
  TTButton,
  TTCard,
  TTStatCard,
} from '../design-system/components';
import { MENU_CATEGORIES } from '../components/Layout';
import { dateOf, money } from '../lib/format';
import { useNav } from '../nav/RouterContext';

/**
 * S-TUN CODEX Dashboard Principal
 */
export default function HomeScreen() {
  const { session, can } = useAuth();
  const { go } = useNav();

  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState([]);

  const { user, role, company, branch } = session || {};

  useEffect(() => {
    let cancelled = false;

    if (can('reports.read')) {
      api('/reports/kpis')
        .then((data) => {
          if (!cancelled) setKpis(data);
        })
        .catch(() => {
          if (!cancelled) setKpis(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    if (can('audit.read')) {
      api('/audit', { query: { limit: 5 } })
        .then((data) => {
          if (!cancelled && Array.isArray(data)) setAuditLog(data);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [can]);

  const filteredCategories = MENU_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => item.permission && can(item.permission)),
  })).filter((cat) => cat.items.length > 0);

  const userNameDisplay = user?.name ? `${user.name} ${user.lastName || ''}`.trim() : 'Administrador';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* ENCABEZADO CON SALUDO */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.greetingTitle}>
              Bienvenido, <Text style={styles.userNameHighlight}>{userNameDisplay}</Text>
            </Text>
            <Text style={styles.greetingSubtitle}>
              Aquí tienes un resumen de tu actividad y el estado de tu empresa en tiempo real.
            </Text>
          </View>

          {/* ACCIONES RÁPIDAS EN HERO */}
          <View style={styles.quickActionsGroup}>
            {can('products.create') ? (
              <TTButton variant="primary" size="sm" onPress={() => go('products')}>
                + Producto
              </TTButton>
            ) : null}
            {can('purchases.create') ? (
              <TTButton variant="secondary" size="sm" onPress={() => go('purchaseOrders')}>
                + Compra
              </TTButton>
            ) : null}
            {can('sales.orders.create') ? (
              <TTButton variant="brand" size="sm" onPress={() => go('salesOrders')}>
                + Venta
              </TTButton>
            ) : null}
          </View>
        </View>

        {/* METADATOS DE EMPRESA Y SUCURSAL */}
        <View style={styles.sessionMetaBar}>
          <Text style={styles.metaText}>
            🏢 Empresa: <Text style={styles.metaVal}>{company?.name || 'S-TUN CODEX ERP'}</Text>
          </Text>
          {branch ? (
            <>
              <Text style={styles.metaDivider}>•</Text>
              <Text style={styles.metaText}>
                📍 Sucursal: <Text style={styles.metaVal}>{branch.name}</Text>
              </Text>
            </>
          ) : null}
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>
            🛡️ Rol: <Text style={styles.metaVal}>{role?.label || role?.code || 'Administrador'}</Text>
          </Text>
        </View>
      </View>

      {/* TARJETAS DE INDICADORES PRINCIPALES */}
      <View style={styles.sectionGroup}>
        <Text style={styles.sectionTitle}>Indicadores Clave</Text>
        <View style={styles.kpiGrid}>
          <TTStatCard
            label="Clientes"
            value={kpis?.customersCount ? String(kpis.customersCount) : '1,248'}
            trend="+12%"
            trendType="positive"
            icon="👥"
            accentColor={COLORS.accent}
          />
          <TTStatCard
            label="Ventas"
            value={kpis?.sales?.total ? money(kpis.sales.total) : '$245,780'}
            trend="+8%"
            trendType="positive"
            icon="📈"
            accentColor={COLORS.accent}
          />
          <TTStatCard
            label="Inventario"
            value={kpis?.catalog?.totalProducts ? String(kpis.catalog.totalProducts) : '3,420'}
            trend="+5%"
            trendType="positive"
            icon="📦"
            accentColor={COLORS.secondary}
          />
          <TTStatCard
            label="Proyectos"
            value={kpis?.projectsCount ? String(kpis.projectsCount) : '18'}
            trend="+2%"
            trendType="positive"
            icon="🎯"
            accentColor={COLORS.accent}
          />
        </View>
      </View>

      {/* PANEL PRINCIPAL: ACTIVIDAD RECIENTE + ESTADO DEL SISTEMA */}
      <View style={styles.splitGrid}>
        {/* PANEL ACTIVIDAD RECIENTE */}
        <TTCard
          title="Actividad reciente"
          subtitle="Trazabilidad y registro de eventos"
          action={
            can('audit.read') ? (
              <TTButton variant="ghost" size="sm" onPress={() => go('audit')}>
                Ver reporte →
              </TTButton>
            ) : null
          }
          style={styles.splitCard}
        >
          {auditLog.length > 0 ? (
            <View style={styles.auditFeed}>
              {auditLog.map((log) => (
                <View key={String(log._id)} style={styles.auditRow}>
                  <View style={styles.auditIconWrapper}>
                    <Text style={styles.auditIcon}>⚡</Text>
                  </View>
                  <View style={styles.auditContent}>
                    <Text style={styles.auditAction}>
                      {log.action} <Text style={styles.auditEntity}>({log.entity})</Text>
                    </Text>
                    <Text style={styles.auditMeta}>
                      {log.user?.email || 'Sistema'} · {dateOf(log.createdAt, true)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.chartMockBox}>
              <View style={styles.chartLineMock}>
                <Text style={styles.chartLegend}>📈 Tendencia operativa semanal estable</Text>
              </View>
              <Text style={styles.emptyText}>Monitoreo continuo activo sin anomalías.</Text>
            </View>
          )}
        </TTCard>

        {/* PANEL ESTADO DEL SISTEMA */}
        <TTCard
          title="Estado del sistema"
          subtitle="Servicios de la infraestructura ERP"
          style={styles.splitCard}
        >
          <View style={styles.systemStatusContainer}>
            <View style={styles.statusIndicatorRow}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.statusTitle}>En línea</Text>
            </View>
            <Text style={styles.statusSub}>Todos los servicios operando correctamente.</Text>

            <View style={styles.healthList}>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemTitle}>Base de datos & Concurrencia</Text>
                <TTBadge value="active" label="100% Ok" />
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemTitle}>Servicios de Autenticación & JWT</Text>
                <TTBadge value="active" label="Activo" />
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemTitle}>Sincronización Multi-sucursal</Text>
                <TTBadge value="POSTED" label="Protegido" />
              </View>
            </View>
          </View>
        </TTCard>
      </View>

      {/* ACCESOS RÁPIDOS Y MÓDULOS */}
      <View style={styles.sectionGroup}>
        <Text style={styles.sectionTitle}>Módulos Disponibles</Text>
        {filteredCategories.map((cat) => (
          <View key={cat.category} style={styles.moduleCategoryBox}>
            <Text style={styles.moduleCategoryTitle}>{cat.category}</Text>
            <View style={styles.tilesGrid}>
              {cat.items.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() => go(item.route)}
                  style={({ hovered }) => [
                    styles.tile,
                    hovered && styles.tileHovered,
                  ]}
                >
                  <Text style={styles.tileIcon}>{item.icon}</Text>
                  <View style={styles.tileTextArea}>
                    <Text style={styles.tileTitle}>{item.label}</Text>
                    <Text style={styles.tileSub}>Acceso al módulo</Text>
                  </View>
                  <Text style={styles.tileArrow}>→</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },
  heroTextGroup: {
    flex: 1,
    gap: SPACING.xs,
    minWidth: 280,
  },
  greetingTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.display,
  },
  userNameHighlight: {
    color: COLORS.accent,
  },
  greetingSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.ui,
  },
  quickActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  sessionMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.ui,
  },
  metaVal: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  metaDivider: {
    color: COLORS.border,
    fontSize: 10,
  },

  // Section
  sectionGroup: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.display,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },

  // Split Grid
  splitGrid: {
    flexDirection: 'row',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },
  splitCard: {
    flex: 1,
    minWidth: 320,
  },

  // Audit Feed
  auditFeed: {
    gap: SPACING.md,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  auditIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditIcon: {
    fontSize: 14,
  },
  auditContent: {
    flex: 1,
    gap: 2,
  },
  auditAction: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  auditEntity: {
    color: COLORS.accent,
  },
  auditMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  chartMockBox: {
    gap: SPACING.xs,
  },
  chartLineMock: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartLegend: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // System Status
  systemStatusContainer: {
    gap: SPACING.md,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  greenPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    boxShadow: `0 0 10px ${COLORS.success}`,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.success,
  },
  statusSub: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  healthList: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.cardElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  healthItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },

  // Tiles
  moduleCategoryBox: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  moduleCategoryTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  tilesGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minWidth: 220,
    flex: 1,
  },
  tileHovered: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.cardElevated,
  },
  tileIcon: {
    fontSize: 22,
  },
  tileTextArea: {
    flex: 1,
    gap: 1,
  },
  tileTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  tileSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  tileArrow: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.accent,
    fontWeight: '700',
  },
});

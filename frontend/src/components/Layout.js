import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  getResponsiveLayout,
} from '../design-system/tokens';
import { TTAvatar, TTBreadcrumb, TTSearch } from '../design-system/components';
import { useNav } from '../nav/RouterContext';
import { STunCodexLogo } from './STunCodexLogo';

/**
 * Categorías de Menú S-TUN CODEX ERP
 */
export const MENU_CATEGORIES = [
  {
    category: 'INICIO',
    items: [
      { route: 'home', label: 'Inicio', icon: '⚡', permission: null },
    ],
  },
  {
    category: 'MÓDULOS',
    items: [
      { route: 'products', label: 'Productos', icon: '📦', permission: 'products.read' },
      { route: 'warehouses', label: 'Almacenes', icon: '🏬', permission: 'warehouses.read' },
      { route: 'stock', label: 'Inventario', icon: '📊', permission: 'inventory.read' },
      { route: 'movements', label: 'Movimientos', icon: '🔄', permission: 'inventory.read' },
      { route: 'counts', label: 'Conteos Físicos', icon: '📋', permission: 'inventory.read' },
      { route: 'suppliers', label: 'Proveedores', icon: '🏢', permission: 'suppliers.read' },
      { route: 'purchaseOrders', label: 'Compras', icon: '🛒', permission: 'purchases.read' },
      { route: 'customers', label: 'Clientes', icon: '👥', permission: 'customers.read' },
      { route: 'salesOrders', label: 'Ventas', icon: '🏷️', permission: 'sales.orders.read' },
    ],
  },
  {
    category: 'FINANZAS',
    items: [
      { route: 'accounts', label: 'Cuentas', icon: '💳', permission: 'finance.accounts.read' },
      { route: 'incomes', label: 'Ingresos', icon: '📈', permission: 'finance.income.read' },
      { route: 'expenses', label: 'Gastos', icon: '📉', permission: 'finance.expenses.read' },
      { route: 'budgets', label: 'Presupuestos', icon: '💰', permission: 'finance.budgets.read' },
      { route: 'reports', label: 'Reportes', icon: '📄', permission: 'reports.read' },
    ],
  },
  {
    category: 'NEGOCIO',
    items: [
      { route: 'leads', label: 'CRM / Leads', icon: '🎯', permission: 'crm.read' },
      { route: 'employees', label: 'Recursos Humanos', icon: '👔', permission: 'hr.read' },
      { route: 'boms', label: 'Listas BOM', icon: '⚙️', permission: 'production.read' },
      { route: 'productionOrders', label: 'Producción', icon: '🏭', permission: 'production.read' },
    ],
  },
  {
    category: 'ADMINISTRACIÓN',
    items: [
      { route: 'branches', label: 'Sucursales', icon: '📍', permission: 'branches.read' },
      { route: 'users', label: 'Usuarios', icon: '👤', permission: 'users.read' },
      { route: 'roles', label: 'Roles y Permisos', icon: '🛡️', permission: 'roles.read' },
      { route: 'audit', label: 'Configuración / Auditoría', icon: '👁️', permission: 'audit.read' },
    ],
  },
];

// Compatibilidad hacia atrás
export const MENU = MENU_CATEGORIES.map((cat) => ({
  section: cat.category,
  items: cat.items,
}));

export default function Layout({ children }) {
  const { session, logout, can } = useAuth();
  const { route, go, back, canGoBack } = useNav();
  const { width } = useWindowDimensions();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const { isMobile, isTablet } = getResponsiveLayout(width);
  const { company, user, role, branch } = session || {};

  const isSidebarCollapsed = isTablet || collapsed;

  const filteredCategories = MENU_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((cat) => cat.items.length > 0);

  const currentItem = MENU_CATEGORIES.flatMap((c) => c.items).find((i) => i.route === route.name);
  const currentCategory = MENU_CATEGORIES.find((c) => c.items.some((i) => i.route === route.name));

  const breadcrumbs = [
    { label: 'S-Tun Codex', onPress: () => go('home') },
    ...(currentCategory ? [{ label: currentCategory.category }] : []),
    ...(currentItem ? [{ label: currentItem.label }] : []),
  ];

  const handleNavigate = (routeName) => {
    go(routeName);
    if (mobileDrawerOpen) setMobileDrawerOpen(false);
  };

  const renderNavSection = (cat) => (
    <View key={cat.category} style={styles.navCategory}>
      {!isSidebarCollapsed ? <Text style={styles.navCategoryTitle}>{cat.category}</Text> : null}
      {cat.items.map((item) => {
        const isActive = route.name === item.route;
        return (
          <Pressable
            key={item.route}
            onPress={() => handleNavigate(item.route)}
            style={({ hovered }) => [
              styles.navItem,
              isSidebarCollapsed && styles.navItemCollapsed,
              isActive && styles.navItemActive,
              hovered && !isActive && styles.navItemHovered,
            ]}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{item.icon}</Text>
            {!isSidebarCollapsed ? (
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.shell}>
      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isMobile ? (
            <Pressable style={styles.iconBtn} onPress={() => setMobileDrawerOpen(true)}>
              <Text style={styles.iconBtnText}>☰</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.iconBtn} onPress={() => setCollapsed((c) => !c)}>
              <Text style={styles.iconBtnText}>{isSidebarCollapsed ? '≫' : '≪'}</Text>
            </Pressable>
          )}

          {canGoBack && route.name !== 'home' ? (
            <Pressable style={styles.backBtn} onPress={back}>
              <Text style={styles.backBtnText}>‹ Volver</Text>
            </Pressable>
          ) : null}

          <TTBreadcrumb items={breadcrumbs} />
        </View>

        <View style={styles.headerRight}>
          {!isMobile ? (
            <TTSearch
              value={globalSearch}
              onChangeText={setGlobalSearch}
              placeholder="Buscar en el sistema…"
              style={styles.globalSearch}
            />
          ) : null}

          <Pressable style={styles.badgeBox}>
            <Text style={styles.badgeCompany}>{company?.name || 'S-TUN CODEX'}</Text>
            {branch ? <Text style={styles.badgeBranch}> · {branch.name}</Text> : null}
          </Pressable>

          <Pressable style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🔔</Text>
          </Pressable>

          <Pressable style={styles.userMenuTrigger} onPress={() => setUserMenuOpen((u) => !u)}>
            <TTAvatar name={user?.name || 'Usuario'} size="sm" color={COLORS.accent} />
            {!isMobile ? (
              <View style={styles.userMeta}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name} {user?.lastName || ''}
                </Text>
                <Text style={styles.userRole} numberOfLines={1}>
                  {role?.label || role?.code || 'Administrador'}
                </Text>
              </View>
            ) : null}
            <Text style={styles.caret}>▾</Text>
          </Pressable>
        </View>
      </View>

      {/* MENÚ FLOTANTE DE USUARIO */}
      {userMenuOpen ? (
        <Modal transparent visible animationType="fade" onRequestClose={() => setUserMenuOpen(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setUserMenuOpen(false)}>
            <View style={styles.userDropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>{user?.name} {user?.lastName || ''}</Text>
                <Text style={styles.dropdownSub}>{user?.email}</Text>
                <Text style={styles.dropdownRole}>Rol: {role?.label || role?.code || 'Administrador'}</Text>
              </View>

              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setUserMenuOpen(false);
                  go('home');
                }}
              >
                <Text style={styles.dropdownItemText}>⚡ Dashboard</Text>
              </Pressable>

              {can('users.read') ? (
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setUserMenuOpen(false);
                    go('users');
                  }}
                >
                  <Text style={styles.dropdownItemText}>⚙️ Configuración</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.dropdownItem, styles.dropdownLogout]}
                onPress={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
              >
                <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}

      {/* CUERPO PRINCIPAL (SIDEBAR + CONTENIDO) */}
      <View style={styles.body}>
        {/* SIDEBAR DESKTOP / TABLET */}
        {!isMobile ? (
          <View style={[styles.sidebar, isSidebarCollapsed && styles.sidebarCollapsed]}>
            <View style={styles.brandHeader}>
              <STunCodexLogo size="md" showTag={!isSidebarCollapsed} />
            </View>

            <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
              {filteredCategories.map(renderNavSection)}
            </ScrollView>
          </View>
        ) : null}

        {/* DRAWER MÓVIL */}
        {isMobile && mobileDrawerOpen ? (
          <Modal transparent visible animationType="slide" onRequestClose={() => setMobileDrawerOpen(false)}>
            <View style={styles.drawerBackdrop}>
              <Pressable style={styles.drawerOverlay} onPress={() => setMobileDrawerOpen(false)} />
              <View style={styles.mobileDrawer}>
                <View style={styles.drawerHeader}>
                  <STunCodexLogo size="md" showTag={true} />
                  <Pressable onPress={() => setMobileDrawerOpen(false)}>
                    <Text style={styles.closeDrawerText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.drawerBody}>
                  {filteredCategories.map(renderNavSection)}
                </ScrollView>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 60,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  backBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  backBtnText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  globalSearch: {
    maxWidth: 280,
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  badgeCompany: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  badgeBranch: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  userMenuTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  userMeta: {
    gap: 1,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    maxWidth: 120,
  },
  userRole: {
    color: COLORS.accent,
    fontSize: 10,
    maxWidth: 120,
  },
  caret: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginRight: 4,
  },

  // Dropdown Menu Usuario
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
    paddingTop: 62,
    paddingRight: 16,
  },
  userDropdown: {
    width: 250,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    gap: 2,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
  },
  dropdownHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 2,
  },
  dropdownTitle: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  dropdownSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  dropdownRole: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 4,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.sm,
  },
  dropdownItemText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dropdownLogout: {
    backgroundColor: `${COLORS.error}20`,
    marginTop: SPACING.xs,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // Layout Body
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  sidebarCollapsed: {
    width: 72,
  },
  brandHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sidebarNav: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  navCategory: {
    marginBottom: SPACING.md,
    gap: 2,
  },
  navCategoryTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  navItemHovered: {
    backgroundColor: 'rgba(58, 123, 213, 0.15)',
  },
  navIcon: {
    fontSize: 16,
  },
  navIconActive: {
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.ui,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  navLabelActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  // Content Area
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  contentInner: {
    padding: SPACING.xl,
    gap: SPACING.xl,
  },

  // Mobile Drawer
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.backdrop,
  },
  drawerOverlay: {
    flex: 1,
  },
  mobileDrawer: {
    width: 280,
    backgroundColor: COLORS.background,
    height: '100%',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  closeDrawerText: {
    color: COLORS.textSecondary,
    fontSize: 20,
    padding: SPACING.xs,
  },
  drawerBody: {
    flex: 1,
  },
});

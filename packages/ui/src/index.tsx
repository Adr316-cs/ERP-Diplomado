import { useWindowDimensions, Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from "react-native";
import type { ReactNode } from "react";

export type NavigationItem = { label: string; active?: boolean; onPress?: () => void };
export type TableRow = { id: string; cells: ReactNode[] };

type ButtonProps = { children: ReactNode; onPress?: () => void; variant?: "primary" | "secondary"; disabled?: boolean };
export const Button = ({ children, onPress, variant = "primary", disabled = false }: ButtonProps) => (
  <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, variant === "secondary" && styles.buttonSecondary, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, variant === "secondary" && styles.buttonSecondaryText]}>{children}</Text>
  </Pressable>
);

export const Input = (props: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{props.label}</Text>
    <TextInput accessibilityLabel={props.label} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} secureTextEntry={props.secureTextEntry} style={styles.input} />
  </View>
);

export const Loading = ({ label = "Cargando…" }: { label?: string }) => <View accessibilityRole="progressbar" style={styles.state}><Text style={styles.bodyText}>{label}</Text></View>;
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => <View accessibilityRole="alert" style={styles.state}><Text style={styles.stateTitle}>No se pudo completar</Text><Text style={styles.bodyText}>{message}</Text>{onRetry && <Button variant="secondary" onPress={onRetry}>Reintentar</Button>}</View>;
export const EmptyState = ({ title = "Sin información", description }: { title?: string; description?: string }) => <View style={styles.state}><Text style={styles.stateTitle}>{title}</Text>{description && <Text style={styles.bodyText}>{description}</Text>}</View>;

export const Notification = ({ message, tone = "info" }: { message: string; tone?: "info" | "success" | "warning" | "error" }) => (
  <View accessibilityRole="alert" style={[styles.notification, tone === "success" && styles.success, tone === "warning" && styles.warning, tone === "error" && styles.error]}><Text style={styles.bodyText}>{message}</Text></View>
);

export const Modal = ({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) => (
  <NativeModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.stateTitle}>{title}</Text>{children}<Button variant="secondary" onPress={onClose}>Cerrar</Button></View></View>
  </NativeModal>
);

export const Table = ({ headers, rows }: { headers: string[]; rows: TableRow[] }) => (
  <ScrollView horizontal contentContainerStyle={styles.tableScroll}>
    <View>
      <View style={[styles.tableRow, styles.tableHeader]}>{headers.map((header) => <Text key={header} style={[styles.tableCell, styles.tableHeaderText]}>{header}</Text>)}</View>
      {rows.length === 0 ? <EmptyState description="Los registros aparecerán aquí cuando estén disponibles." /> : rows.map((row) => <View key={row.id} style={styles.tableRow}>{row.cells.map((cell, index) => <View key={`${row.id}-${index}`} style={styles.tableCell}><Text style={styles.bodyText}>{cell}</Text></View>)}</View>)}
    </View>
  </ScrollView>
);

export const Form = ({ title, children, submitLabel = "Guardar", onSubmit }: { title: string; children: ReactNode; submitLabel?: string; onSubmit: () => void }) => (
  <View style={styles.card}><Text style={styles.stateTitle}>{title}</Text>{children}<Button onPress={onSubmit}>{submitLabel}</Button></View>
);

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.header}><Text style={styles.brand}>ERP</Text><View style={styles.headerCopy}><Text style={styles.headerTitle}>{title}</Text>{subtitle && <Text style={styles.muted}>{subtitle}</Text>}</View></View>
);

export const Navigation = ({ items, horizontal = false }: { items: NavigationItem[]; horizontal?: boolean }) => (
  <ScrollView horizontal={horizontal} contentContainerStyle={[styles.navigation, horizontal && styles.navigationHorizontal]}>
    {items.map((item) => <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: item.active }} onPress={item.onPress} style={[styles.navItem, item.active && styles.navItemActive]}><Text style={[styles.navText, item.active && styles.navTextActive]}>{item.label}</Text></Pressable>)}
  </ScrollView>
);

export const Sidebar = ({ items, horizontal = false }: { items: NavigationItem[]; horizontal?: boolean }) => <View style={[styles.sidebar, horizontal && styles.sidebarHorizontal]}><Navigation items={items} horizontal={horizontal} /></View>;
export const Breadcrumbs = ({ items }: { items: string[] }) => <Text accessibilityRole="header" style={styles.breadcrumb}>{items.join("  /  ")}</Text>;
export const Dashboard = ({ children }: { children: ReactNode }) => <View style={styles.dashboard}>{children}</View>;

export const Layout = ({ title, subtitle, navigation, children }: { title: string; subtitle?: string; navigation: NavigationItem[]; children: ReactNode }) => {
  const compact = useWindowDimensions().width < 720;
  return <View style={styles.layout}><Header title={title} {...(subtitle === undefined ? {} : { subtitle })} /><View style={[styles.body, compact && styles.bodyCompact]}><Sidebar items={navigation} horizontal={compact} /><ScrollView style={styles.main} contentContainerStyle={styles.content}>{children}</ScrollView></View></View>;
};

const styles = StyleSheet.create({
  layout: { flex: 1, minHeight: "100%", backgroundColor: "#f3f6fa" },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#10243a", gap: 16 },
  brand: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  headerCopy: { flex: 1 },
  headerTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  muted: { color: "#bfccda", fontSize: 12, marginTop: 2 },
  body: { flex: 1, flexDirection: "row" },
  bodyCompact: { flexDirection: "column" },
  sidebar: { width: 232, padding: 16, backgroundColor: "#ffffff", borderRightWidth: 1, borderRightColor: "#dce4ed" },
  sidebarHorizontal: { width: "100%", paddingVertical: 8, paddingHorizontal: 12, borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: "#dce4ed" },
  navigation: { gap: 6 },
  navigationHorizontal: { flexDirection: "row" },
  navItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  navItemActive: { backgroundColor: "#e8f1fb" },
  navText: { color: "#43546a", fontSize: 14 },
  navTextActive: { color: "#14599b", fontWeight: "700" },
  main: { flex: 1 },
  content: { padding: 24, gap: 16 },
  dashboard: { gap: 16 },
  card: { padding: 18, gap: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dce4ed", borderRadius: 10 },
  state: { padding: 18, gap: 8, alignItems: "flex-start" },
  stateTitle: { color: "#172b43", fontSize: 17, fontWeight: "700" },
  bodyText: { color: "#43546a", fontSize: 14 },
  label: { color: "#263b52", fontSize: 13, fontWeight: "600" },
  inputGroup: { gap: 6 },
  input: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#c6d2df", borderRadius: 7, color: "#172b43", backgroundColor: "#ffffff" },
  button: { minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 7, backgroundColor: "#1769aa" },
  buttonSecondary: { backgroundColor: "#edf2f7", borderWidth: 1, borderColor: "#c6d2df" },
  buttonText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  buttonSecondaryText: { color: "#243b53" },
  disabled: { opacity: 0.5 },
  notification: { padding: 12, borderRadius: 8, backgroundColor: "#e8f1fb" },
  success: { backgroundColor: "#e8f6ee" },
  warning: { backgroundColor: "#fff4d6" },
  error: { backgroundColor: "#fdebea" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#00000066" },
  modalCard: { alignSelf: "center", width: "100%", maxWidth: 520, padding: 20, gap: 16, borderRadius: 12, backgroundColor: "#ffffff" },
  tableScroll: { minWidth: "100%" },
  tableRow: { flexDirection: "row", minHeight: 46, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#dce4ed" },
  tableHeader: { backgroundColor: "#edf2f7" },
  tableCell: { minWidth: 130, paddingHorizontal: 12, paddingVertical: 10 },
  tableHeaderText: { color: "#243b53", fontSize: 13, fontWeight: "700" },
  breadcrumb: { color: "#62758a", fontSize: 13 }
});


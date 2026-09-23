import { SafeAreaView, ScrollView, Text, View } from "react-native";

export const App = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 700, color: "#14213d" }}>ERP Empresarial</Text>
      <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 18, marginTop: 16 }}>
        <Text style={{ fontWeight: 600, marginBottom: 8 }}>Dashboard base</Text>
        <Text>Aplicación móvil base lista para continuar con autenticación y navegación.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);
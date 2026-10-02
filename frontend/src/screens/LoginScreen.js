import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../design-system/tokens';
import { TTButton, TTInput } from '../design-system/components';
import { STunCodexLogo } from '../components/STunCodexLogo';

/** Pantalla de inicio de sesión S-TUN CODEX ERP */
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message || 'Credenciales inválidas. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* LOGO OFICIAL S-TUN CODEX */}
        <View style={styles.brandHeader}>
          <STunCodexLogo size="lg" layout="vertical" showTag={true} />
        </View>

        <View style={styles.sloganBox}>
          <Text style={styles.sloganText}>Tu empresa, en el <Text style={styles.sloganHighlight}>siguiente nivel.</Text></Text>
          <Text style={styles.pillsText}>INTEGRA  ·  AUTOMATIZA  ·  CRECE</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <TTInput
          label="Usuario o correo"
          value={email}
          onChangeText={setEmail}
          placeholder="usuario@estun-codex.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          disabled={loading}
        />

        <TTInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          disabled={loading}
          onSubmitEditing={onSubmit}
        />

        <TTButton
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading || !email || !password}
          onPress={onSubmit}
          style={styles.submitBtn}
        >
          Iniciar sesión
        </TTButton>

        <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>

        <View style={styles.footerLine}>
          <Text style={styles.footerNote}>S-TUN CODEX · CONSTRUIDO PARA EL FUTURO</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    gap: SPACING.md,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  sloganBox: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  sloganText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  sloganHighlight: {
    color: COLORS.accent,
  },
  pillsText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
  },
  errorBox: {
    backgroundColor: `${COLORS.error}15`,
    borderColor: `${COLORS.error}40`,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  forgotLink: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  footerNote: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

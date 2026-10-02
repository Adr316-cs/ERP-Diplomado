package com.diplomado.erp.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val STunCodexColorScheme = darkColorScheme(
    primary = STunCyanAccent,
    onPrimary = STunMidnight,
    primaryContainer = STunStructure,
    onPrimaryContainer = STunTextPrimary,
    secondary = STunBlueSecondary,
    onSecondary = STunTextPrimary,
    secondaryContainer = STunSurfaceDark,
    onSecondaryContainer = STunTextPrimary,
    background = STunMidnight,
    onBackground = STunTextPrimary,
    surface = STunDarkBlue,
    onSurface = STunTextPrimary,
    surfaceVariant = STunSurfaceDark,
    onSurfaceVariant = STunTextSecondary,
    outline = STunDarkBorder,
    outlineVariant = STunSilverBorder,
    error = STunError,
    onError = STunWhite
)

@Composable
fun DiplomadoERPTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = STunCodexColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

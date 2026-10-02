package com.diplomado.erp.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.diplomado.erp.ui.theme.*

/**
 * Emblema oficial en vector de S-TUN CODEX — Escudo pentagonal tecnológico con núcleo y circuitos.
 */
@Composable
fun STunCodexLogoIcon(
    sizeDp: Int = 40,
    modifier: Modifier = Modifier
) {
    val size = sizeDp.dp

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val cx = w / 2f
            val cy = h / 2f

            // 1. Escudo Pentagonal Exterior
            val outerPath = Path().apply {
                moveTo(cx, h * 0.05f)               // Top point
                lineTo(w * 0.92f, h * 0.32f)         // Top right
                lineTo(w * 0.82f, h * 0.88f)         // Bottom right
                lineTo(w * 0.18f, h * 0.88f)         // Bottom left
                lineTo(w * 0.08f, h * 0.32f)         // Top left
                close()
            }
            drawPath(
                path = outerPath,
                color = STunCyanAccent,
                style = Stroke(width = w * 0.06f)
            )

            // 2. Anillo pentagonal medio
            val midPath = Path().apply {
                moveTo(cx, h * 0.16f)
                lineTo(w * 0.82f, h * 0.37f)
                lineTo(w * 0.74f, h * 0.80f)
                lineTo(w * 0.26f, h * 0.80f)
                lineTo(w * 0.18f, h * 0.37f)
                close()
            }
            drawPath(
                path = midPath,
                color = STunBlueSecondary,
                style = Stroke(width = w * 0.04f)
            )

            // 3. Casco visor tecnológico interno
            val visorPath = Path().apply {
                moveTo(cx - w * 0.28f, cy - h * 0.18f)
                lineTo(cx + w * 0.28f, cy - h * 0.18f)
                lineTo(cx + w * 0.34f, cy + h * 0.06f)
                lineTo(cx, cy + h * 0.28f)
                lineTo(cx - w * 0.34f, cy + h * 0.06f)
                close()
            }
            drawPath(
                path = visorPath,
                color = STunWhite
            )

            // 4. Núcleo Pentagonal Central (Azul oscuro / Cian)
            val corePath = Path().apply {
                moveTo(cx, cy - h * 0.12f)
                lineTo(cx + w * 0.18f, cy - h * 0.02f)
                lineTo(cx + w * 0.11f, cy + h * 0.15f)
                lineTo(cx - w * 0.11f, cy + h * 0.15f)
                lineTo(cx - w * 0.18f, cy - h * 0.02f)
                close()
            }
            drawPath(
                path = corePath,
                color = STunMidnight
            )
            drawPath(
                path = corePath,
                color = STunCyanAccent,
                style = Stroke(width = w * 0.03f)
            )

            // 5. Líneas de circuito radiales desde el núcleo
            drawLine(
                color = STunCyanAccent,
                start = Offset(cx, cy - h * 0.12f),
                end = Offset(cx, cy - h * 0.18f),
                strokeWidth = w * 0.025f
            )
            drawLine(
                color = STunCyanAccent,
                start = Offset(cx + w * 0.18f, cy - h * 0.02f),
                end = Offset(cx + w * 0.26f, cy - h * 0.02f),
                strokeWidth = w * 0.025f
            )
            drawLine(
                color = STunCyanAccent,
                start = Offset(cx - w * 0.18f, cy - h * 0.02f),
                end = Offset(cx - w * 0.26f, cy - h * 0.02f),
                strokeWidth = w * 0.025f
            )
        }
    }
}

/**
 * Logotipo Completo S-TUN CODEX — Lockup Horizontal / Vertical
 */
@Composable
fun STunCodexLogo(
    modifier: Modifier = Modifier,
    isLarge: Boolean = false,
    showTagline: Boolean = true,
    isVertical: Boolean = false
) {
    val iconSize = if (isLarge) 48 else 36
    val titleSize = if (isLarge) 24.sp else 18.sp
    val subtitleSize = if (isLarge) 10.sp else 9.sp

    if (isVertical) {
        Column(
            modifier = modifier,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            STunCodexLogoIcon(sizeDp = iconSize)
            Spacer(modifier = Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "S-Tun ",
                    color = STunCyanAccent,
                    fontSize = titleSize,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif
                )
                Text(
                    text = "Codex",
                    color = STunWhite,
                    fontSize = titleSize,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif
                )
            }
            if (showTagline) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "INTELLIGENT ERP SOLUTIONS",
                    color = STunBlueSecondary,
                    fontSize = subtitleSize,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
            }
        }
    } else {
        Row(
            modifier = modifier,
            verticalAlignment = Alignment.CenterVertically
        ) {
            STunCodexLogoIcon(sizeDp = iconSize)
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "S-Tun ",
                        color = STunCyanAccent,
                        fontSize = titleSize,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.SansSerif
                    )
                    Text(
                        text = "Codex",
                        color = STunWhite,
                        fontSize = titleSize,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.SansSerif
                    )
                }
                if (showTagline) {
                    Text(
                        text = "INTELLIGENT ERP SOLUTIONS",
                        color = STunCyanAccent,
                        fontSize = subtitleSize,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.1.sp
                    )
                }
            }
        }
    }
}

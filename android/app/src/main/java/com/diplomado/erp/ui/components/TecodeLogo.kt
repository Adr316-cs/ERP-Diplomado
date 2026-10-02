package com.diplomado.erp.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun TecodeLogoIcon(
    sizeDp: Int = 40,
    modifier: Modifier = Modifier
) {
    STunCodexLogoIcon(sizeDp = sizeDp, modifier = modifier)
}

@Composable
fun TecodeLogo(
    modifier: Modifier = Modifier,
    isLarge: Boolean = false,
    showTagline: Boolean = true
) {
    STunCodexLogo(
        modifier = modifier,
        isLarge = isLarge,
        showTagline = showTagline
    )
}

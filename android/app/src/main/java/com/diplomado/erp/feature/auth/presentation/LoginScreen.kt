package com.diplomado.erp.feature.auth.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.diplomado.erp.ui.components.*
import com.diplomado.erp.ui.theme.*

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: LoginViewModel = viewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(STunMidnight)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 440.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            TTCard {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    STunCodexLogo(isLarge = true, showTagline = true, isVertical = true)

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Tu empresa, en el siguiente nivel.",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = STunWhite,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "INTEGRA · AUTOMATIZA · CRECE",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = STunCyanAccent,
                        letterSpacing = 1.2.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    if (uiState is LoginUiState.Error) {
                        Text(
                            text = "⚠️ ${(uiState as LoginUiState.Error).message}",
                            color = STunError,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    TTTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = "Usuario o correo",
                        placeholder = "usuario@estun-codex.com",
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    TTTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = "Contraseña",
                        placeholder = "••••••••",
                        isPassword = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    TTButton(
                        text = "Iniciar sesión",
                        onClick = { viewModel.login(email, password) },
                        modifier = Modifier.fillMaxWidth(),
                        variant = TTButtonVariant.Primary,
                        loading = uiState is LoginUiState.Loading,
                        enabled = email.isNotEmpty() && password.isNotEmpty()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "¿Olvidaste tu contraseña?",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = STunCyanAccent,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "S-TUN CODEX · CONSTRUIDO PARA EL FUTURO",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = STunSlateGray,
                        letterSpacing = 1.sp,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }
    }
}

package com.diplomado.erp.feature.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.diplomado.erp.core.network.client.RetrofitClient
import com.diplomado.erp.core.network.dto.LoginRequest
import com.diplomado.erp.core.security.TokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class LoginUiState {
    data object Idle : LoginUiState()
    data object Loading : LoginUiState()
    data object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Ingrese correo y contraseña.")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val response = RetrofitClient.api.login(LoginRequest(email.trim(), password))
                val body = response.body()
                if (response.isSuccessful && body?.success == true) {
                    val loginData = body.data
                    if (loginData != null) {
                        TokenStorage.saveTokens(loginData.accessToken, loginData.refreshToken)
                        fetchMeAndSaveSession()
                    } else {
                        TokenStorage.clear()
                        _uiState.value = LoginUiState.Error("Respuesta inválida del servidor.")
                    }
                } else {
                    TokenStorage.clear()
                    val errorMsg = body?.error?.message
                        ?: "Credenciales inválidas. Verifique sus datos."
                    _uiState.value = LoginUiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                TokenStorage.clear()
                _uiState.value = LoginUiState.Error(e.message ?: "Error de conexión con el servidor.")
            }
        }
    }

    private suspend fun fetchMeAndSaveSession() {
        val response = RetrofitClient.api.getMe()
        val body = response.body()
        val me = body?.data
        if (!response.isSuccessful || body?.success != true || me == null) {
            throw IllegalStateException(
                body?.error?.message ?: "No se pudo validar la sesión con el servidor."
            )
        }

        val role = me.role
            ?: throw IllegalStateException("El servidor no confirmó el rol de este usuario.")
        val permissions = role.permissions
            ?: throw IllegalStateException("El servidor no confirmó los permisos del usuario.")
        if (me.user.companyId != null && me.company?.id != me.user.companyId) {
            throw IllegalStateException("El servidor no confirmó la empresa de la sesión.")
        }
        if (me.user.branchId != null && me.branch?.id != me.user.branchId) {
            throw IllegalStateException("El servidor no confirmó la sucursal de la sesión.")
        }

        TokenStorage.saveSessionInfo(
            email = me.user.email,
            name = me.user.name,
            roleLabel = role.label.ifBlank { role.code },
            permissions = permissions,
            companyId = me.user.companyId,
            companyName = me.company?.name ?: "S-TUN CODEX ERP",
            branchId = me.user.branchId,
            branchName = me.branch?.name ?: ""
        )
        _uiState.value = LoginUiState.Success
    }
}

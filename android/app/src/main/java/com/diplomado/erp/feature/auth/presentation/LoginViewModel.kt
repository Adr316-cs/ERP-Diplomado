package com.diplomado.erp.feature.auth.presentation

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.diplomado.erp.core.network.client.RetrofitClient
import com.diplomado.erp.core.network.dto.LoginRequest
import com.diplomado.erp.core.security.TokenStorage
import com.google.gson.JsonParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.ResponseBody

sealed class LoginUiState {
    data object Idle : LoginUiState()
    data object Loading : LoginUiState()
    data object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel : ViewModel() {

    private companion object {
        const val TAG = "LoginDiagnostics"
        val SAFE_ERROR_CODE = Regex("[A-Z][A-Z0-9_]{0,63}")
    }

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Ingrese correo y contraseña.")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            Log.d(TAG, "LOGIN_REQUEST_STARTED")
            val response = try {
                RetrofitClient.api.login(LoginRequest(email.trim(), password))
            } catch (error: Exception) {
                TokenStorage.clear()
                Log.w(TAG, "LOGIN_REQUEST_FAILED type=${error.javaClass.simpleName}")
                _uiState.value = LoginUiState.Error(
                    "No se pudo completar la solicitud POST /auth/login."
                )
                return@launch
            }

            Log.d(TAG, "LOGIN_HTTP_STATUS=${response.code()}")
            if (!response.isSuccessful) {
                TokenStorage.clear()
                val errorCode = readSafeErrorCode(response.errorBody())
                if (errorCode != null) Log.d(TAG, "LOGIN_ERROR_CODE=$errorCode")
                val diagnosis = errorCode ?: loginFallback(response.code())
                _uiState.value = LoginUiState.Error("HTTP ${response.code()} — $diagnosis")
                return@launch
            }

            val body = response.body()
            val loginData = body?.data
            if (body?.success != true || loginData == null) {
                TokenStorage.clear()
                val errorCode = body?.error?.code?.takeIf(::isSafeErrorCode)
                if (errorCode != null) Log.d(TAG, "LOGIN_ERROR_CODE=$errorCode")
                val diagnosis = errorCode ?: "Respuesta de login inválida"
                _uiState.value = LoginUiState.Error("HTTP ${response.code()} — $diagnosis")
                return@launch
            }

            Log.d(TAG, "LOGIN_ACCEPTED")
            try {
                TokenStorage.saveTokens(loginData.accessToken, loginData.refreshToken)
            } catch (_: Exception) {
                TokenStorage.clear()
                Log.w(TAG, "SESSION_STORAGE=FAILED")
                _uiState.value = LoginUiState.Error(
                    "Login aceptado, pero no se pudo guardar la sesión de forma segura."
                )
                return@launch
            }

            val sessionError = fetchMeAndSaveSession()
            if (sessionError != null) {
                TokenStorage.clear()
                _uiState.value = LoginUiState.Error(sessionError)
                return@launch
            }

            _uiState.value = LoginUiState.Success
            Log.d(TAG, "LOGIN_FLOW=SUCCESS")
        }
    }

    private suspend fun fetchMeAndSaveSession(): String? {
        val response = try {
            RetrofitClient.api.getMe()
        } catch (_: Exception) {
            Log.w(TAG, "ME_REQUEST_FAILED")
            return "Login aceptado, pero falló la validación de sesión (/auth/me). No se pudo completar la solicitud."
        }

        Log.d(TAG, "ME_HTTP_STATUS=${response.code()}")
        val body = response.body()
        val me = body?.data
        if (!response.isSuccessful || body?.success != true || me == null) {
            val errorCode = readSafeErrorCode(response.errorBody())
                ?: body?.error?.code?.takeIf(::isSafeErrorCode)
            if (errorCode != null) Log.d(TAG, "ME_ERROR_CODE=$errorCode")
            val details = errorCode?.let { " — $it" } ?: ""
            return "Login aceptado, pero falló la validación de sesión (/auth/me). HTTP ${response.code()}$details."
        }

        val role = me.role
            ?: return failSessionValidation(
                "ROLE_MISSING",
                "Sesión recibida correctamente, pero falta el rol."
            )
        val permissions = role.permissions
            ?: return failSessionValidation(
                "PERMISSIONS_MISSING",
                "Sesión recibida correctamente, pero faltan permisos."
            )
        if (me.user.companyId != null && me.company?.id != me.user.companyId) {
            return failSessionValidation(
                "COMPANY_INVALID",
                "Sesión recibida correctamente, pero no se encontró una empresa válida."
            )
        }
        if (me.user.branchId != null && me.branch?.id != me.user.branchId) {
            return failSessionValidation(
                "BRANCH_INVALID",
                "Sesión recibida correctamente, pero no se encontró una sucursal válida."
            )
        }

        try {
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
        } catch (_: Exception) {
            Log.w(TAG, "SESSION_STORAGE=FAILED")
            return "Sesión validada, pero no se pudo guardar el contexto de forma segura."
        }

        Log.d(TAG, "SESSION_VALIDATION=SUCCESS")
        return null
    }

    private fun failSessionValidation(code: String, message: String): String {
        Log.w(TAG, "SESSION_VALIDATION=$code")
        return message
    }

    private fun readSafeErrorCode(errorBody: ResponseBody?): String? {
        return try {
            val errorJson = errorBody?.string()?.takeIf { it.isNotBlank() } ?: return null
            val error = JsonParser.parseString(errorJson)
                .takeIf { it.isJsonObject }
                ?.asJsonObject
                ?.getAsJsonObject("error")
            error?.get("code")
                ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
                ?.asString
                ?.takeIf(::isSafeErrorCode)
        } catch (_: Exception) {
            null
        }
    }

    private fun isSafeErrorCode(code: String): Boolean =
        SAFE_ERROR_CODE.matches(code)

    private fun loginFallback(httpStatus: Int): String =
        if (httpStatus == 401) "Error de autenticación" else "Error en inicio de sesión"
}

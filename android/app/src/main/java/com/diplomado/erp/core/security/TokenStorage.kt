package com.diplomado.erp.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object TokenStorage {

    private const val PREFS_NAME = "erp_secure_tokens"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_USER_EMAIL = "user_email"
    private const val KEY_USER_NAME = "user_name"
    private const val KEY_ROLE_LABEL = "role_label"
    private const val KEY_PERMISSIONS = "permissions"
    private const val KEY_COMPANY_ID = "company_id"
    private const val KEY_COMPANY_NAME = "company_name"
    private const val KEY_BRANCH_ID = "branch_id"
    private const val KEY_BRANCH_NAME = "branch_name"

    private var prefs: SharedPreferences? = null
    private val mutableSessionInvalidated = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val sessionInvalidated = mutableSessionInvalidated.asSharedFlow()

    fun init(context: Context) {
        prefs = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            android.util.Log.e("TokenStorage", "No se pudo inicializar el almacenamiento cifrado.", e)
            null
        }
    }

    fun saveTokens(accessToken: String, refreshToken: String) {
        requireNotNull(prefs) { "El almacenamiento seguro de sesión no está disponible." }
            .edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
    }

    fun getAccessToken(): String? = prefs?.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs?.getString(KEY_REFRESH_TOKEN, null)

    fun saveSessionInfo(
        email: String,
        name: String,
        roleLabel: String,
        permissions: List<String>,
        companyId: String?,
        companyName: String,
        branchId: String?,
        branchName: String
    ) {
        val editor = requireNotNull(prefs) {
            "El almacenamiento seguro de sesión no está disponible."
        }.edit()
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_ROLE_LABEL, roleLabel)
            .putStringSet(KEY_PERMISSIONS, permissions.toSet())
            .putString(KEY_COMPANY_ID, companyId)
            .putString(KEY_COMPANY_NAME, companyName)
            .putString(KEY_BRANCH_ID, branchId)
            .putString(KEY_BRANCH_NAME, branchName)
        editor.apply()
    }

    fun getPermissions(): Set<String> {
        return prefs?.getStringSet(KEY_PERMISSIONS, emptySet()) ?: emptySet()
    }

    fun getUserEmail(): String = prefs?.getString(KEY_USER_EMAIL, "") ?: ""
    fun getUserName(): String = prefs?.getString(KEY_USER_NAME, "") ?: ""
    fun getRoleLabel(): String = prefs?.getString(KEY_ROLE_LABEL, "") ?: ""
    fun getCompanyId(): String? = prefs?.getString(KEY_COMPANY_ID, null)
    fun getCompanyName(): String = prefs?.getString(KEY_COMPANY_NAME, "S-TUN CODEX ERP") ?: "S-TUN CODEX ERP"
    fun getBranchId(): String? = prefs?.getString(KEY_BRANCH_ID, null)
    fun getBranchName(): String = prefs?.getString(KEY_BRANCH_NAME, "") ?: ""

    fun clear() {
        prefs?.edit()?.clear()?.apply()
    }

    fun invalidateSession() {
        clear()
        mutableSessionInvalidated.tryEmit(Unit)
    }

    fun hasValidSession(): Boolean {
        return !getAccessToken().isNullOrEmpty() && !getRefreshToken().isNullOrEmpty()
    }
}

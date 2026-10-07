package com.diplomado.erp.feature.customers.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.diplomado.erp.core.network.client.RetrofitClient
import com.diplomado.erp.core.network.dto.CustomerDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CustomerFormData(
    val code: String = "",
    val name: String = "",
    val taxId: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val notes: String? = null,
    val status: String = "active"
)

sealed class CustomersUiState {
    data object Loading : CustomersUiState()
    data class Success(val customers: List<CustomerDto>, val total: Int) : CustomersUiState()
    data class Error(val message: String) : CustomersUiState()
}

class CustomersViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<CustomersUiState>(CustomersUiState.Loading)
    val uiState: StateFlow<CustomersUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
    }

    fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = CustomersUiState.Loading
            try {
                val response = RetrofitClient.api.getCustomers()
                if (response.isSuccessful && response.body()?.data != null) {
                    val customers = response.body()!!.data!!
                    _uiState.value = CustomersUiState.Success(customers, customers.size)
                } else {
                    _uiState.value = CustomersUiState.Error(
                        response.body()?.error?.message ?: "Error al cargar clientes."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = CustomersUiState.Error(e.message ?: "Error de red.")
            }
        }
    }

    fun saveCustomer(form: CustomerFormData, customerId: String? = null) {
        viewModelScope.launch {
            val code = form.code.trim()
            val name = form.name.trim()
            if (code.isEmpty()) {
                _uiState.value = CustomersUiState.Error("El código del cliente es obligatorio.")
                return@launch
            }
            if (name.isEmpty()) {
                _uiState.value = CustomersUiState.Error("El nombre del cliente es obligatorio.")
                return@launch
            }

            val payload = mutableMapOf<String, Any?>()
            payload["code"] = code
            payload["name"] = name
            payload["taxId"] = form.taxId?.takeIf { it.isNotBlank() }
            payload["email"] = form.email?.takeIf { it.isNotBlank() }
            payload["phone"] = form.phone?.takeIf { it.isNotBlank() }
            payload["notes"] = form.notes?.takeIf { it.isNotBlank() }
            payload["status"] = form.status

            try {
                val response = if (customerId != null) {
                    RetrofitClient.api.updateCustomer(customerId, payload)
                } else {
                    RetrofitClient.api.createCustomer(payload)
                }

                if (response.isSuccessful && response.body()?.success == true) {
                    loadCustomers()
                } else {
                    _uiState.value = CustomersUiState.Error(
                        response.body()?.error?.message ?: "No se pudo guardar el cliente."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = CustomersUiState.Error(e.message ?: "Error de red al guardar el cliente.")
            }
        }
    }

    fun deleteCustomer(customerId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api.deleteCustomer(customerId)
                if (response.isSuccessful && response.body()?.success == true) {
                    loadCustomers()
                } else {
                    _uiState.value = CustomersUiState.Error(
                        response.body()?.error?.message ?: "No se pudo eliminar el cliente."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = CustomersUiState.Error(e.message ?: "Error de red al eliminar el cliente.")
            }
        }
    }
}

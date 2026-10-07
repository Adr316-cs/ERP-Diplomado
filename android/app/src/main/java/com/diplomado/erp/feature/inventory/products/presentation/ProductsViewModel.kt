package com.diplomado.erp.feature.inventory.products.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.diplomado.erp.core.network.client.RetrofitClient
import com.diplomado.erp.core.network.dto.ProductDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProductFormData(
    val sku: String = "",
    val name: String = "",
    val category: String? = null,
    val unit: String? = null,
    val trackingMode: String = "none",
    val costPrice: Double? = 0.0,
    val salePrice: Double? = 0.0,
    val minStock: Double? = 0.0,
    val maxStock: Double? = null,
    val description: String? = null,
    val status: String = "active"
)

sealed class ProductsUiState {
    data object Loading : ProductsUiState()
    data class Success(val products: List<ProductDto>, val total: Int) : ProductsUiState()
    data class Error(val message: String) : ProductsUiState()
}

class ProductsViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<ProductsUiState>(ProductsUiState.Loading)
    val uiState: StateFlow<ProductsUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    init {
        loadProducts()
    }

    fun onSearchChange(query: String) {
        _searchQuery.value = query
        loadProducts(query)
    }

    fun loadProducts(search: String? = _searchQuery.value) {
        viewModelScope.launch {
            _uiState.value = ProductsUiState.Loading
            try {
                val searchParam = if (search.isNullOrEmpty()) null else search
                val res = RetrofitClient.api.getProducts(page = 1, limit = 50, search = searchParam)
                if (res.isSuccessful && res.body()?.data != null) {
                    val list = res.body()!!.data!!
                    val total = res.body()!!.meta?.total ?: list.size
                    _uiState.value = ProductsUiState.Success(list, total)
                } else {
                    _uiState.value = ProductsUiState.Error(res.body()?.error?.message ?: "Error al cargar productos.")
                }
            } catch (e: Exception) {
                _uiState.value = ProductsUiState.Error(e.message ?: "Error de red.")
            }
        }
    }

    fun saveProduct(form: ProductFormData, productId: String? = null) {
        viewModelScope.launch {
            val payload = mutableMapOf<String, Any?>()
            val sku = form.sku.trim()
            val name = form.name.trim()

            if (sku.isEmpty()) {
                _uiState.value = ProductsUiState.Error("El SKU es obligatorio.")
                return@launch
            }
            if (name.isEmpty()) {
                _uiState.value = ProductsUiState.Error("El nombre del producto es obligatorio.")
                return@launch
            }
            if ((form.minStock ?: 0.0) < 0 || (form.maxStock ?: 0.0) < 0) {
                _uiState.value = ProductsUiState.Error("Los valores de stock no pueden ser negativos.")
                return@launch
            }
            if (form.maxStock != null && form.maxStock < (form.minStock ?: 0.0)) {
                _uiState.value = ProductsUiState.Error("El stock máximo no puede ser menor que el mínimo.")
                return@launch
            }

            payload["sku"] = sku
            payload["name"] = name
            payload["category"] = form.category?.takeIf { it.isNotBlank() }
            payload["unit"] = form.unit?.takeIf { it.isNotBlank() }
            payload["trackingMode"] = form.trackingMode
            payload["costPrice"] = form.costPrice
            payload["salePrice"] = form.salePrice
            payload["minStock"] = form.minStock ?: 0.0
            payload["maxStock"] = form.maxStock
            payload["description"] = form.description?.takeIf { it.isNotBlank() }
            payload["status"] = form.status

            try {
                val response = if (productId != null) {
                    RetrofitClient.api.updateProduct(productId, payload)
                } else {
                    RetrofitClient.api.createProduct(payload)
                }
                if (response.isSuccessful && response.body()?.success == true) {
                    loadProducts()
                } else {
                    _uiState.value = ProductsUiState.Error(
                        response.body()?.error?.message ?: "No se pudo guardar el producto."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = ProductsUiState.Error(e.message ?: "Error de red al guardar el producto.")
            }
        }
    }

    fun deleteProduct(productId: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api.deleteProduct(productId)
                if (response.isSuccessful && response.body()?.success == true) {
                    loadProducts()
                    return@launch
                }

                val message = response.body()?.error?.message ?: "No se pudo eliminar el producto."
                val payload = mutableMapOf<String, Any?>()
                payload["status"] = "inactive"
                val fallback = RetrofitClient.api.updateProduct(productId, payload)
                if (fallback.isSuccessful && fallback.body()?.success == true) {
                    loadProducts()
                } else {
                    _uiState.value = ProductsUiState.Error(
                        fallback.body()?.error?.message ?: message
                    )
                }
            } catch (e: Exception) {
                _uiState.value = ProductsUiState.Error(e.message ?: "Error de red al eliminar el producto.")
            }
        }
    }
}

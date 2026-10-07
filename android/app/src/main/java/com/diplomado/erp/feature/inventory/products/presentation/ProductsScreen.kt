package com.diplomado.erp.feature.inventory.products.presentation

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.diplomado.erp.core.common.rbac.PermissionChecker
import com.diplomado.erp.core.network.dto.ProductDto
import com.diplomado.erp.ui.components.TTBadge
import com.diplomado.erp.ui.components.TTButton
import com.diplomado.erp.ui.components.TTButtonVariant
import com.diplomado.erp.ui.components.TTCard
import com.diplomado.erp.ui.components.TTDataTable
import com.diplomado.erp.ui.components.TTEmptyState
import com.diplomado.erp.ui.components.TTLoading
import com.diplomado.erp.ui.components.TTTextField
import com.diplomado.erp.ui.theme.STunBlueSecondary
import com.diplomado.erp.ui.theme.STunSlateGray
import com.diplomado.erp.ui.theme.STunWhite

@Composable
fun ProductsScreen(
    modifier: Modifier = Modifier,
    viewModel: ProductsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val context = LocalContext.current

    var showForm by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<ProductDto?>(null) }
    var formState by remember { mutableStateOf(ProductFormData()) }
    var pendingDelete by remember { mutableStateOf<ProductDto?>(null) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uiState, toastMessage) {
        when (val state = uiState) {
            is ProductsUiState.Success -> {
                if (toastMessage != null) {
                    Toast.makeText(context, toastMessage, Toast.LENGTH_SHORT).show()
                    toastMessage = null
                }
            }
            is ProductsUiState.Error -> {
                Toast.makeText(context, state.message, Toast.LENGTH_LONG).show()
            }
            else -> {}
        }
    }

    Box(modifier = modifier.fillMaxSize().padding(16.dp)) {
        when (val state = uiState) {
            is ProductsUiState.Loading -> TTLoading(text = "Cargando catálogo de productos...")
            is ProductsUiState.Error -> {
                TTEmptyState(
                    title = "Error de catálogo",
                    description = state.message,
                    actionLabel = "Reintentar",
                    onAction = { viewModel.loadProducts() }
                )
            }
            is ProductsUiState.Success -> {
                TTDataTable(
                    title = "Catálogo de Productos",
                    subtitle = "${state.total} productos registrados",
                    items = state.products,
                    searchQuery = searchQuery,
                    onSearchChange = { viewModel.onSearchChange(it) },
                    onCreateClick = if (PermissionChecker.hasPermission("products.create")) {
                        {
                            editingProduct = null
                            formState = ProductFormData()
                            showForm = true
                        }
                    } else null,
                    createLabel = "Nuevo producto",
                    emptyText = "Sin productos registrados."
                ) { material ->
                    TTCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = material.name,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = STunWhite
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "SKU: ${material.sku} • Unidad: ${material.unit ?: "unidad"} • Costo: $${String.format("%.2f", material.costPrice ?: 0.0)}",
                                        fontSize = 12.sp,
                                        color = STunSlateGray
                                    )
                                    if ((material.minStock ?: 0.0) > 0) {
                                        Text(
                                            text = "Stock mín: ${material.minStock} | Stock máx: ${material.maxStock ?: "N/A"}",
                                            fontSize = 11.sp,
                                            color = STunBlueSecondary
                                        )
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    TTBadge(status = material.status)
                                    val mode = material.trackingMode ?: "none"
                                    if (mode != "none" && mode.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        TTBadge(status = "active", customLabel = "Control ${mode.uppercase()}")
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (PermissionChecker.hasPermission("products.update")) {
                                    TTButton(
                                        text = "Editar",
                                        onClick = {
                                            editingProduct = material
                                            formState = ProductFormData(
                                                sku = material.sku,
                                                name = material.name,
                                                category = material.category,
                                                unit = material.unit,
                                                trackingMode = material.trackingMode ?: "none",
                                                costPrice = material.costPrice ?: 0.0,
                                                salePrice = material.salePrice ?: 0.0,
                                                minStock = material.minStock ?: 0.0,
                                                maxStock = material.maxStock,
                                                description = material.description,
                                                status = material.status
                                            )
                                            showForm = true
                                        },
                                        variant = TTButtonVariant.Secondary,
                                        modifier = Modifier.width(110.dp)
                                    )
                                }
                                if (PermissionChecker.hasPermission("products.delete")) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    TTButton(
                                        text = "Eliminar",
                                        onClick = { pendingDelete = material },
                                        variant = TTButtonVariant.Danger,
                                        modifier = Modifier.width(110.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showForm) {
        AlertDialog(
            onDismissRequest = { showForm = false },
            title = { Text(text = if (editingProduct != null) "Editar producto" else "Nuevo producto") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    TTTextField(
                        value = formState.sku,
                        onValueChange = { formState = formState.copy(sku = it) },
                        label = "SKU",
                        placeholder = "PROD-001"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.name,
                        onValueChange = { formState = formState.copy(name = it) },
                        label = "Nombre",
                        placeholder = "Producto"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.category ?: "",
                        onValueChange = { formState = formState.copy(category = it) },
                        label = "Categoría"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.unit ?: "",
                        onValueChange = { formState = formState.copy(unit = it) },
                        label = "Unidad"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.trackingMode,
                        onValueChange = { formState = formState.copy(trackingMode = it) },
                        label = "Trazabilidad"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.costPrice?.toString() ?: "0",
                        onValueChange = { newValue ->
                            val parsed = newValue.toDoubleOrNull()
                            formState = formState.copy(costPrice = parsed ?: 0.0)
                        },
                        label = "Costo"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.salePrice?.toString() ?: "0",
                        onValueChange = { newValue ->
                            val parsed = newValue.toDoubleOrNull()
                            formState = formState.copy(salePrice = parsed ?: 0.0)
                        },
                        label = "Precio de venta"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.minStock?.toString() ?: "0",
                        onValueChange = { newValue ->
                            val parsed = newValue.toDoubleOrNull()
                            formState = formState.copy(minStock = parsed ?: 0.0)
                        },
                        label = "Stock mínimo"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.maxStock?.toString() ?: "",
                        onValueChange = { newValue ->
                            val parsed = newValue.toDoubleOrNull()
                            formState = formState.copy(maxStock = parsed)
                        },
                        label = "Stock máximo"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.description ?: "",
                        onValueChange = { formState = formState.copy(description = it) },
                        label = "Descripción"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.status,
                        onValueChange = { formState = formState.copy(status = it) },
                        label = "Estado"
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    showForm = false
                    if (editingProduct != null) {
                        toastMessage = "Producto actualizado correctamente."
                        viewModel.saveProduct(formState, editingProduct!!.id)
                    } else {
                        toastMessage = "Producto creado correctamente."
                        viewModel.saveProduct(formState)
                    }
                }) {
                    Text("Guardar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showForm = false }) {
                    Text("Cancelar")
                }
            }
        )
    }

    pendingDelete?.let { product ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text(text = "Confirmación") },
            text = { Text("¿Deseas eliminar o desactivar el producto \"${product.name}\"?") },
            confirmButton = {
                TextButton(onClick = {
                    toastMessage = "Producto eliminado correctamente."
                    viewModel.deleteProduct(product.id)
                    pendingDelete = null
                }) {
                    Text("Confirmar")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

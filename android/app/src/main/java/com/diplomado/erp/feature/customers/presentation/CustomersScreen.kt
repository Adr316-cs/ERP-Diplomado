package com.diplomado.erp.feature.customers.presentation

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
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
import com.diplomado.erp.core.network.dto.CustomerDto
import com.diplomado.erp.ui.components.TTBadge
import com.diplomado.erp.ui.components.TTButton
import com.diplomado.erp.ui.components.TTButtonVariant
import com.diplomado.erp.ui.components.TTCard
import com.diplomado.erp.ui.components.TTDataTable
import com.diplomado.erp.ui.components.TTEmptyState
import com.diplomado.erp.ui.components.TTLoading
import com.diplomado.erp.ui.components.TTTextField
import com.diplomado.erp.ui.theme.STunSlateGray
import com.diplomado.erp.ui.theme.STunWhite

@Composable
fun CustomersScreen(
    modifier: Modifier = Modifier,
    viewModel: CustomersViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showForm by remember { mutableStateOf(false) }
    var editingCustomer by remember { mutableStateOf<CustomerDto?>(null) }
    var formState by remember { mutableStateOf(CustomerFormData()) }
    var pendingDelete by remember { mutableStateOf<CustomerDto?>(null) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uiState, toastMessage) {
        when (val state = uiState) {
            is CustomersUiState.Success -> {
                if (toastMessage != null) {
                    Toast.makeText(context, toastMessage, Toast.LENGTH_SHORT).show()
                    toastMessage = null
                }
            }
            is CustomersUiState.Error -> {
                Toast.makeText(context, state.message, Toast.LENGTH_LONG).show()
            }
            else -> {}
        }
    }

    when (val state = uiState) {
        is CustomersUiState.Loading -> TTLoading(text = "Cargando clientes...")
        is CustomersUiState.Error -> {
            TTEmptyState(
                title = "Error de clientes",
                description = state.message,
                actionLabel = "Reintentar",
                onAction = { viewModel.loadCustomers() }
            )
        }
        is CustomersUiState.Success -> {
            var searchQuery by remember { mutableStateOf("") }
            val filtered = if (searchQuery.isBlank()) {
                state.customers
            } else {
                state.customers.filter { customer ->
                    customer.name.contains(searchQuery, ignoreCase = true) ||
                        customer.code.contains(searchQuery, ignoreCase = true) ||
                        (customer.email ?: "").contains(searchQuery, ignoreCase = true)
                }
            }

            TTDataTable(
                title = "Clientes",
                subtitle = "${state.total} clientes registrados",
                items = filtered,
                searchQuery = searchQuery,
                onSearchChange = { searchQuery = it },
                onCreateClick = if (PermissionChecker.hasPermission("customers.create")) {
                    {
                        editingCustomer = null
                        formState = CustomerFormData()
                        showForm = true
                    }
                } else null,
                createLabel = "Nuevo cliente",
                emptyText = "Sin clientes registrados."
            ) { customer ->
                TTCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = customer.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = STunWhite
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Código: ${customer.code} • ${customer.email ?: "Sin correo"}",
                                    fontSize = 12.sp,
                                    color = STunSlateGray
                                )
                            }
                            TTBadge(status = customer.status)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (PermissionChecker.hasPermission("customers.update")) {
                                TTButton(
                                    text = "Editar",
                                    onClick = {
                                        editingCustomer = customer
                                        formState = CustomerFormData(
                                            code = customer.code,
                                            name = customer.name,
                                            taxId = customer.taxId ?: "",
                                            email = customer.email ?: "",
                                            phone = customer.phone ?: "",
                                            notes = customer.notes ?: "",
                                            status = customer.status
                                        )
                                        showForm = true
                                    },
                                    variant = TTButtonVariant.Secondary,
                                    modifier = Modifier.width(110.dp)
                                )
                            }
                            if (PermissionChecker.hasPermission("customers.delete")) {
                                Spacer(modifier = Modifier.width(8.dp))
                                TTButton(
                                    text = "Eliminar",
                                    onClick = { pendingDelete = customer },
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

    if (showForm) {
        AlertDialog(
            onDismissRequest = { showForm = false },
            title = { Text(text = if (editingCustomer != null) "Editar cliente" else "Nuevo cliente") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    TTTextField(
                        value = formState.code,
                        onValueChange = { formState = formState.copy(code = it) },
                        label = "Código",
                        placeholder = "CLI-001"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.name,
                        onValueChange = { formState = formState.copy(name = it) },
                        label = "Nombre",
                        placeholder = "Cliente XYZ"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.taxId ?: "",
                        onValueChange = { formState = formState.copy(taxId = it) },
                        label = "RFC / NIF",
                        placeholder = "RFC123"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.email ?: "",
                        onValueChange = { formState = formState.copy(email = it) },
                        label = "Correo",
                        placeholder = "cliente@correo.com"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.phone ?: "",
                        onValueChange = { formState = formState.copy(phone = it) },
                        label = "Teléfono",
                        placeholder = "+52..."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.notes ?: "",
                        onValueChange = { formState = formState.copy(notes = it) },
                        label = "Notas",
                        placeholder = "Observaciones"
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TTTextField(
                        value = formState.status,
                        onValueChange = { formState = formState.copy(status = it) },
                        label = "Estado",
                        placeholder = "active"
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val payload = formState
                    showForm = false
                    if (editingCustomer != null) {
                        viewModel.saveCustomer(payload, editingCustomer!!.id)
                        toastMessage = "Cliente actualizado correctamente."
                    } else {
                        viewModel.saveCustomer(payload)
                        toastMessage = "Cliente creado correctamente."
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

    pendingDelete?.let { customer ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text(text = "Confirmación") },
            text = { Text("¿Deseas eliminar el cliente \"${customer.name}\"?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteCustomer(customer.id)
                    toastMessage = "Cliente eliminado correctamente."
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

package com.diplomado.erp.feature.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.diplomado.erp.core.security.TokenStorage
import com.diplomado.erp.ui.components.*
import com.diplomado.erp.ui.theme.*

@Composable
fun DashboardScreen(
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val userName = TokenStorage.getUserName().ifEmpty { "Administrador" }
    val userEmail = TokenStorage.getUserEmail()
    val roleLabel = TokenStorage.getRoleLabel().ifEmpty { "Administrador" }
    val companyName = TokenStorage.getCompanyName().ifEmpty { "S-TUN CODEX ERP" }
    val branchName = TokenStorage.getBranchName()

    Box(modifier = modifier.fillMaxSize().background(STunMidnight).padding(16.dp)) {
        when (val state = uiState) {
            is DashboardUiState.Loading -> {
                TTLoading(text = "Cargando métricas de S-TUN CODEX...")
            }
            is DashboardUiState.Error -> {
                TTEmptyState(
                    title = "Error de conexión",
                    description = state.message,
                    actionLabel = "Reintentar",
                    onAction = { viewModel.loadData() }
                )
            }
            is DashboardUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // SALUDO Y ENCABEZADO
                    item {
                        TTCard {
                            Column {
                                Text(
                                    text = "Bienvenido, $userName",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = STunWhite
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Aquí tienes un resumen de tu actividad.",
                                    fontSize = 13.sp,
                                    color = STunSlateGray
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "🏢 $companyName",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = STunCyanAccent
                                    )
                                    if (branchName.isNotEmpty()) {
                                        Text(
                                            text = "  •  📍 $branchName",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = STunCyanAccent
                                        )
                                    }
                                    Text(
                                        text = "  •  🛡️ $roleLabel",
                                        fontSize = 12.sp,
                                        color = STunSlateGray
                                    )
                                }
                            }
                        }
                    }

                    // INDICADORES PRINCIPALES (TARJETAS KPI COMO LA IMAGEN)
                    item {
                        Text(
                            text = "Indicadores Principales",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = STunWhite
                        )
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            TTStatCard(
                                label = "Clientes",
                                value = "1,248",
                                trend = "+12%",
                                accentColor = STunCyanAccent,
                                modifier = Modifier.weight(1f)
                            )
                            TTStatCard(
                                label = "Ventas",
                                value = "$245,780",
                                trend = "+8%",
                                accentColor = STunCyanAccent,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            TTStatCard(
                                label = "Inventario",
                                value = "${state.kpis?.catalog?.totalProducts ?: 3420}",
                                trend = "+5%",
                                accentColor = STunBlueSecondary,
                                modifier = Modifier.weight(1f)
                            )
                            TTStatCard(
                                label = "Proyectos",
                                value = "18",
                                trend = "+2%",
                                accentColor = STunCyanAccent,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // ESTADO DEL SISTEMA
                    item {
                        TTCard(title = "Estado del sistema") {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(CircleShape)
                                            .background(STunSuccess)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "En línea",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = STunSuccess
                                    )
                                }
                                Text(
                                    text = "Todos los servicios operando correctamente.",
                                    fontSize = 13.sp,
                                    color = STunSlateGray
                                )
                            }
                        }
                    }

                    // ACTIVIDAD RECIENTE
                    item {
                        Text(
                            text = "Actividad reciente",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = STunWhite
                        )
                    }

                    if (state.auditLogs.isNotEmpty()) {
                        items(state.auditLogs) { log ->
                            TTCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "${log.action} (${log.entity})",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = STunWhite
                                        )
                                        Text(
                                            text = "${log.user?.email ?: "Sistema"} • ${log.createdAt?.take(10) ?: ""}",
                                            fontSize = 12.sp,
                                            color = STunSlateGray
                                        )
                                    }
                                    TTBadge(status = "active", customLabel = "Registrado")
                                }
                            }
                        }
                    } else {
                        item {
                            TTCard {
                                Text(
                                    text = "📈 Tendencia de actividad semanal constante. Sin incidencias.",
                                    fontSize = 13.sp,
                                    color = STunCyanAccent
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

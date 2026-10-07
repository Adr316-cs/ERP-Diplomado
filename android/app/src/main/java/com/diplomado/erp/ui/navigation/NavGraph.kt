package com.diplomado.erp.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import android.widget.Toast
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.diplomado.erp.core.network.client.RetrofitClient
import com.diplomado.erp.core.security.TokenStorage
import com.diplomado.erp.feature.auth.presentation.LoginScreen
import com.diplomado.erp.feature.configuration.presentation.AuditScreen
import com.diplomado.erp.feature.customers.presentation.CustomersScreen
import com.diplomado.erp.feature.dashboard.presentation.DashboardScreen
import com.diplomado.erp.feature.finance.presentation.AccountsScreen
import com.diplomado.erp.feature.inventory.movements.presentation.MovementsScreen
import com.diplomado.erp.feature.inventory.products.presentation.ProductsScreen
import com.diplomado.erp.feature.inventory.stock.presentation.StockScreen
import com.diplomado.erp.feature.projects.presentation.ProjectDetailScreen
import com.diplomado.erp.feature.projects.presentation.ProjectsScreen
import com.diplomado.erp.feature.purchases.presentation.PurchaseOrdersScreen
import com.diplomado.erp.feature.sales.presentation.SalesOrdersScreen
import com.diplomado.erp.ui.components.TTBottomBar
import com.diplomado.erp.ui.components.TTTopBar
import com.diplomado.erp.ui.theme.TecodeBackground
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect

@Composable
fun NavGraph(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val startDestination = if (TokenStorage.hasValidSession()) {
        NavDestination.Main.route
    } else {
        NavDestination.Login.route
    }

    LaunchedEffect(navController) {
        TokenStorage.sessionInvalidated.collect {
            if (navController.currentDestination?.route != NavDestination.Login.route) {
                navController.navigate(NavDestination.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable(NavDestination.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(NavDestination.Main.route) {
                        popUpTo(NavDestination.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(NavDestination.Main.route) {
            MainContainer(
                onLogout = {
                    scope.launch {
                        var logoutError: String? = null
                        try {
                            val response = RetrofitClient.api.logout()
                            val body = response.body()
                            if (
                                !response.isSuccessful ||
                                body?.success != true ||
                                body.data?.loggedOut != true
                            ) {
                                logoutError = body?.error?.message
                                    ?: "El servidor no confirmó el cierre de sesión."
                            }
                        } catch (error: Exception) {
                            logoutError = error.message
                                ?: "No se pudo confirmar el cierre de sesión con el servidor."
                        } finally {
                            TokenStorage.clear()
                            navController.navigate(NavDestination.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                        if (logoutError != null) {
                            Toast.makeText(
                                context,
                                logoutError ?: "No se confirmó el cierre de sesión remoto.",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                }
            )
        }
    }
}

@Composable
fun MainContainer(
    onLogout: () -> Unit
) {
    val innerNavController = rememberNavController()
    val navBackStackEntry by innerNavController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: NavDestination.Dashboard.route

    Scaffold(
        topBar = {
            TTTopBar(onLogoutClick = onLogout)
        },
        bottomBar = {
            TTBottomBar(
                currentRoute = currentRoute,
                onNavigate = { route ->
                    innerNavController.navigate(route) {
                        popUpTo(NavDestination.Dashboard.route) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        },
        containerColor = TecodeBackground
    ) { innerPadding ->
        NavHost(
            navController = innerNavController,
            startDestination = NavDestination.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(NavDestination.Dashboard.route) {
                DashboardScreen(onNavigate = { route -> innerNavController.navigate(route) })
            }
            composable(NavDestination.Projects.route) {
                ProjectsScreen(
                    onProjectClick = { projectId ->
                        innerNavController.navigate(NavDestination.ProjectDetail.createRoute(projectId))
                    }
                )
            }
            composable(
                route = NavDestination.ProjectDetail.route,
                arguments = listOf(navArgument("projectId") { type = NavType.StringType })
            ) { backStackEntry ->
                val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
                ProjectDetailScreen(
                    projectId = projectId,
                    onBackClick = { innerNavController.popBackStack() }
                )
            }
            composable(NavDestination.Products.route) {
                ProductsScreen()
            }
            composable(NavDestination.Customers.route) {
                CustomersScreen()
            }
            composable(NavDestination.Stock.route) {
                StockScreen()
            }
            composable(NavDestination.Purchases.route) {
                PurchaseOrdersScreen()
            }
            composable(NavDestination.Sales.route) {
                SalesOrdersScreen()
            }
            composable(NavDestination.Finance.route) {
                AccountsScreen()
            }
            composable(NavDestination.More.route) {
                AuditScreen()
            }
        }
    }
}

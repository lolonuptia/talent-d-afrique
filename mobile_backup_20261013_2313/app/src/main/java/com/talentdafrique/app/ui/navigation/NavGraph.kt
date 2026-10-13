package com.talentdafrique.app.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.talentdafrique.app.ui.screens.auth.LoginScreen
import com.talentdafrique.app.ui.screens.auth.RegisterScreen
import com.talentdafrique.app.ui.screens.candidatures.CandidaturesScreen
import com.talentdafrique.app.ui.screens.home.HomeScreen
import com.talentdafrique.app.ui.screens.notifications.NotificationsScreen
import com.talentdafrique.app.ui.screens.offres.OffreDetailScreen
import com.talentdafrique.app.ui.screens.offres.OffresListScreen
import com.talentdafrique.app.ui.screens.profile.ProfileScreen

object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val OFFRES = "offres"
    const val OFFRE_DETAIL = "offre/{offreId}"
    const val CANDIDATURES = "candidatures"
    const val NOTIFICATIONS = "notifications"
    const val PROFILE = "profile"

    fun offreDetail(offreId: String) = "offre/$offreId"
}

private val mainRoutes = setOf(
    Routes.HOME,
    Routes.OFFRES,
    Routes.CANDIDATURES,
    Routes.NOTIFICATIONS,
    Routes.PROFILE,
)

// Durée courte et cohérente pour toutes les transitions — assez rapide pour ne pas
// ralentir la navigation, assez visible pour ne pas sembler un simple "cut".
private const val TRANSITION_DURATION_MS = 260

/**
 * Le mobile est réservé aux étudiants (freelance/entreprise/école restent sur le web) —
 * plus besoin de paramètre typeProfil ici, HomeScreen n'a qu'un seul chemin.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TalentDAfriqueNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Routes.LOGIN,
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            if (currentRoute in mainRoutes) {
                TalentDAfriqueBottomBar(navController)
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding),
            enterTransition = {
                fadeIn(tween(TRANSITION_DURATION_MS)) +
                    slideInHorizontally(tween(TRANSITION_DURATION_MS)) { fullWidth -> fullWidth / 6 }
            },
            exitTransition = {
                fadeOut(tween(TRANSITION_DURATION_MS)) +
                    slideOutHorizontally(tween(TRANSITION_DURATION_MS)) { fullWidth -> -fullWidth / 6 }
            },
            popEnterTransition = {
                fadeIn(tween(TRANSITION_DURATION_MS)) +
                    slideInHorizontally(tween(TRANSITION_DURATION_MS)) { fullWidth -> -fullWidth / 6 }
            },
            popExitTransition = {
                fadeOut(tween(TRANSITION_DURATION_MS)) +
                    slideOutHorizontally(tween(TRANSITION_DURATION_MS)) { fullWidth -> fullWidth / 6 }
            },
        ) {
            composable(Routes.LOGIN) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = { navController.navigate(Routes.REGISTER) },
                )
            }

            composable(Routes.REGISTER) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = { navController.popBackStack() },
                )
            }

            composable(Routes.HOME) {
                Scaffold(topBar = { TopAppBar(title = { Text("Talent d'Afrique") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        HomeScreen(
                            onOffreClick = { offreId -> navController.navigate(Routes.offreDetail(offreId)) },
                            onSeeAllOffresClick = {
                                navController.navigate(Routes.OFFRES) {
                                    launchSingleTop = true
                                }
                            },
                        )
                    }
                }
            }

            composable(Routes.OFFRES) {
                Scaffold(topBar = { TopAppBar(title = { Text("Offres") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        OffresListScreen(
                            onOffreClick = { offreId -> navController.navigate(Routes.offreDetail(offreId)) },
                        )
                    }
                }
            }

            composable(Routes.OFFRE_DETAIL) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text("Détail de l'offre") },
                            navigationIcon = {
                                IconButton(onClick = { navController.popBackStack() }) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Retour",
                                    )
                                }
                            },
                        )
                    },
                ) { padding ->
                    Box(Modifier.padding(padding)) {
                        OffreDetailScreen(
                            onCandidatureEnvoyee = { navController.popBackStack() },
                        )
                    }
                }
            }

            composable(Routes.CANDIDATURES) {
                Scaffold(topBar = { TopAppBar(title = { Text("Mes candidatures") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        CandidaturesScreen()
                    }
                }
            }

            composable(Routes.NOTIFICATIONS) {
                Scaffold(topBar = { TopAppBar(title = { Text("Notifications") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        NotificationsScreen()
                    }
                }
            }

            composable(Routes.PROFILE) {
                Scaffold(topBar = { TopAppBar(title = { Text("Mon profil") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        ProfileScreen()
                    }
                }
            }
        }
    }
}
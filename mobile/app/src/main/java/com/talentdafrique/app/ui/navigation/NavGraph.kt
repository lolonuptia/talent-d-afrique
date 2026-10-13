package com.talentdafrique.app.ui.navigation

import com.talentdafrique.app.ui.screens.compte.CompteScreen

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
    const val FORGOT_PASSWORD = "forgot_password"

    const val FAVORIS = "favoris"
    const val ENTRETIENS = "entretiens"
    const val MESSAGES = "messages"
    const val CONVERSATION = "messages/{candidatureId}"
    const val CANDIDATURE_DETAIL = "candidature/{candidatureId}"
    const val CERTIFICATIONS = "certifications"
    const val PORTFOLIO = "portfolio"
    const val ECOLE = "ecole"

    fun conversation(candidatureId: String) = "messages/$candidatureId"
    fun candidatureDetail(candidatureId: String) = "candidature/$candidatureId"
    const val COMPTE = "compte"

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
                    onNavigateToForgot = { navController.navigate(Routes.FORGOT_PASSWORD) },
                )
            }

            composable(Routes.FORGOT_PASSWORD) {
                SubScreen("Mot de passe oublié", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.auth.ForgotPasswordScreen(onDone = { navController.popBackStack() })
                }
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
                        CandidaturesScreen(onCandidatureClick = { navController.navigate(Routes.candidatureDetail(it)) })
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

            composable(Routes.COMPTE) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text("Mon compte") },
                            navigationIcon = {
                                IconButton(onClick = { navController.popBackStack() }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                                }
                            },
                        )
                    },
                ) { padding ->
                    Box(Modifier.padding(padding)) { CompteScreen() }
                }
            }

            composable(Routes.FAVORIS) {
                SubScreen("Mes favoris", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.favoris.FavorisScreen(
                        onOffreClick = { navController.navigate(Routes.offreDetail(it)) },
                    )
                }
            }

            composable(Routes.ENTRETIENS) {
                SubScreen("Mes entretiens", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.entretiens.EntretiensScreen(
                        onCandidatureClick = { navController.navigate(Routes.candidatureDetail(it)) },
                    )
                }
            }

            composable(Routes.MESSAGES) {
                SubScreen("Messages", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.messages.ConversationsScreen(
                        onOpen = { navController.navigate(Routes.conversation(it)) },
                    )
                }
            }

            composable(Routes.CONVERSATION) {
                SubScreen("Conversation", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.messages.ConversationScreen()
                }
            }

            composable(Routes.CANDIDATURE_DETAIL) {
                SubScreen("Ma candidature", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.candidatures.CandidatureDetailScreen(
                        onOpenMessages = { navController.navigate(Routes.conversation(it)) },
                        onOpenOffre = { navController.navigate(Routes.offreDetail(it)) },
                        onRetiree = { navController.popBackStack() },
                    )
                }
            }

            composable(Routes.CERTIFICATIONS) {
                SubScreen("Mes certifications", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.certifications.CertificationsScreen()
                }
            }

            composable(Routes.PORTFOLIO) {
                SubScreen("Mon portfolio", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.portfolio.PortfolioScreen()
                }
            }

            composable(Routes.ECOLE) {
                SubScreen("Mon école", onBack = { navController.popBackStack() }) {
                    com.talentdafrique.app.ui.screens.ecole.EcoleScreen()
                }
            }

            composable(Routes.PROFILE) {
                Scaffold(topBar = { TopAppBar(title = { Text("Mon profil") }) }) { padding ->
                    Box(Modifier.padding(padding)) {
                        ProfileScreen(onNavigate = { navController.navigate(it) }, onOpenCompte = { navController.navigate(Routes.COMPTE) })
                    }
                }
            }
        }
    }
}
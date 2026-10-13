package com.talentdafrique.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.outlined.Assignment
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState

private data class BottomNavItem(
    val route: String,
    val label: String,
    val filledIcon: ImageVector,
    val outlinedIcon: ImageVector,
)

private val bottomNavItems = listOf(
    BottomNavItem(Routes.HOME, "Accueil", Icons.Filled.Home, Icons.Outlined.Home),
    BottomNavItem(Routes.OFFRES, "Offres", Icons.Filled.Work, Icons.Outlined.Work),
    BottomNavItem(Routes.CANDIDATURES, "Suivi", Icons.AutoMirrored.Filled.Assignment, Icons.AutoMirrored.Outlined.Assignment),
    BottomNavItem(Routes.NOTIFICATIONS, "Notifs", Icons.Filled.Notifications, Icons.Outlined.Notifications),
    BottomNavItem(Routes.PROFILE, "Profil", Icons.Filled.Person, Icons.Outlined.Person),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TalentDAfriqueBottomBar(
    navController: NavHostController,
    badgeViewModel: NotificationBadgeViewModel = hiltViewModel(),
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val unread by badgeViewModel.count.collectAsState()

    LaunchedEffect(currentRoute) { badgeViewModel.refreshNow() }

    NavigationBar(tonalElevation = 3.dp) {
        bottomNavItems.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (!selected) {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    val icon = if (selected) item.filledIcon else item.outlinedIcon
                    if (item.route == Routes.NOTIFICATIONS && unread > 0) {
                        BadgedBox(badge = { Badge { Text(if (unread > 9) "9+" else unread.toString()) } }) {
                            Icon(imageVector = icon, contentDescription = item.label)
                        }
                    } else {
                        Icon(imageVector = icon, contentDescription = item.label)
                    }
                },
                label = { Text(item.label) },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                ),
            )
        }
    }
}
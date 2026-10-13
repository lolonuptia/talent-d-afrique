package com.talentdafrique.app.ui.screens.home

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Le mobile est réservé aux étudiants (freelance/entreprise/école restent sur le web) —
 * pas besoin de branches par type de profil ici.
 */
@Composable
fun HomeScreen(
    onOffreClick: (String) -> Unit = {},
    onSeeAllOffresClick: () -> Unit = {},
) {
    EtudiantHomeContent(
        onOffreClick = onOffreClick,
        onSeeAllClick = onSeeAllOffresClick,
        modifier = Modifier.fillMaxSize(),
    )
}
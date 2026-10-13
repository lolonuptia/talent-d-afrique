package com.talentdafrique.app.ui.screens.favoris

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import com.talentdafrique.app.ui.screens.offres.OffreCard

@Composable
fun FavorisScreen(
    onOffreClick: (String) -> Unit,
    viewModel: FavorisViewModel = hiltViewModel(),
) {
    val ui by viewModel.uiState.collectAsState()
    when {
        ui.isLoading -> LoadingView()
        ui.errorMessage != null -> ErrorView(
            message = ui.errorMessage ?: "",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )
        ui.favoris.isEmpty() -> EmptyView(
            title = "Aucun favori",
            subtitle = "Ajoute des offres depuis leur page pour les retrouver ici.",
            icon = Icons.Outlined.FavoriteBorder,
        )
        else -> LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(ui.favoris, key = { it.id }) { favori ->
                val offre = favori.offre
                if (offre != null) {
                    Column {
                        OffreCard(offre = offre, onClick = { onOffreClick(offre.id) })
                        TextButton(onClick = { viewModel.retirer(favori.offreId) }) { Text("Retirer des favoris") }
                    }
                }
            }
        }
    }
}
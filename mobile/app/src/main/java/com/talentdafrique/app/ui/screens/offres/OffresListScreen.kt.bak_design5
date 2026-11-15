package com.talentdafrique.app.ui.screens.offres

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView

private val typeFilters = listOf(
    null to "Toutes",
    "stage" to "Stage",
    "cdd" to "CDD",
    "cdi" to "CDI",
    "mission" to "Mission",
)

@Composable
fun OffresListScreen(
    onOffreClick: (String) -> Unit,
    viewModel: OffresListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(typeFilters) { (value, label) ->
                FilterChip(
                    selected = uiState.selectedType == value,
                    onClick = { viewModel.onTypeFilterSelected(value) },
                    label = { androidx.compose.material3.Text(label) },
                    colors = FilterChipDefaults.filterChipColors(),
                )
            }
        }

        when {
            uiState.isLoading -> LoadingView(modifier = Modifier.fillMaxSize())

            uiState.errorMessage != null -> ErrorView(
                message = uiState.errorMessage ?: "",
                onRetry = viewModel::loadOffres,
                icon = Icons.Outlined.WifiOff,
            )

            uiState.offres.isEmpty() -> EmptyView(
                title = "Aucune offre trouvée",
                subtitle = "Essaie un autre filtre ou reviens plus tard.",
                icon = Icons.Outlined.SearchOff,
            )

            else -> LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.offres, key = { it.id }) { offre ->
                    OffreCard(offre = offre, onClick = { onOffreClick(offre.id) })
                }
            }
        }
    }
}
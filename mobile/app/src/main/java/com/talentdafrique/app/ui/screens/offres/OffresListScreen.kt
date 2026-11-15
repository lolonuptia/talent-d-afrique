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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
    val visibles = uiState.visibles

    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = uiState.query,
            onValueChange = viewModel::onQueryChange,
            placeholder = { Text("Titre, ville, compétence…") },
            singleLine = true,
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
            trailingIcon = {
                if (uiState.query.isNotEmpty()) {
                    IconButton(onClick = { viewModel.onQueryChange("") }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Effacer la recherche")
                    }
                }
            },
            shape = RoundedCornerShape(28.dp),
            modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 12.dp),
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(typeFilters) { (value, label) ->
                FilterChip(
                    selected = uiState.selectedType == value,
                    onClick = { viewModel.onTypeFilterSelected(value) },
                    label = { Text(label) },
                    shape = RoundedCornerShape(20.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    ),
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

            visibles.isEmpty() -> EmptyView(
                title = "Aucune offre trouvée",
                subtitle = if (uiState.query.isNotBlank()) {
                    "Aucun résultat pour « ${uiState.query.trim()} ». Essaie un autre mot."
                } else {
                    "Essaie un autre filtre ou reviens plus tard."
                },
                icon = Icons.Outlined.SearchOff,
            )

            else -> {
                Text(
                    text = "${visibles.size} offre${if (visibles.size > 1) "s" else ""}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                )
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(visibles, key = { it.id }) { offre ->
                        OffreCard(offre = offre, onClick = { onOffreClick(offre.id) })
                    }
                }
            }
        }
    }
}

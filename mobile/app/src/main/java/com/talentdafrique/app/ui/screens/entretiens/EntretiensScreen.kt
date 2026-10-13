package com.talentdafrique.app.ui.screens.entretiens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView

@Composable
fun EntretiensScreen(
    onCandidatureClick: (String) -> Unit,
    viewModel: EntretiensViewModel = hiltViewModel(),
) {
    val ui by viewModel.uiState.collectAsState()
    when {
        ui.isLoading -> LoadingView()
        ui.errorMessage != null -> ErrorView(
            message = ui.errorMessage ?: "",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )
        ui.entretiens.isEmpty() -> EmptyView(
            title = "Aucun entretien",
            subtitle = "Tes entretiens planifiés par les entreprises apparaîtront ici.",
            icon = Icons.Outlined.Event,
        )
        else -> LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(ui.entretiens, key = { it.id }) { e ->
                EntretienCard(entretien = e, onClick = { onCandidatureClick(e.candidatureId) })
            }
        }
    }
}
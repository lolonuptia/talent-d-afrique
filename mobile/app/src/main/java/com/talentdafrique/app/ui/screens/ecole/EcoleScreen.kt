package com.talentdafrique.app.ui.screens.ecole

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView

@Composable
fun EcoleScreen(viewModel: EcoleViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    when {
        ui.isLoading -> LoadingView()
        ui.errorMessage != null -> ErrorView(
            message = ui.errorMessage ?: "",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )
        ui.ecoles.isEmpty() -> EmptyView(
            title = "Aucune école inscrite",
            subtitle = "Les écoles partenaires apparaîtront ici dès leur inscription.",
            icon = Icons.Outlined.School,
        )
        else -> Column(modifier = Modifier.fillMaxSize()) {
            ui.actionError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(16.dp))
            }
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(ui.ecoles, key = { it.id }) { ecole ->
                    val estLaMienne = ui.currentEcoleId == ecole.id
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        border = BorderStroke(1.dp, if (estLaMienne) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(ecole.nomEtablissement ?: "École", style = MaterialTheme.typography.titleSmall)
                                ecole.localisation?.takeIf { it.isNotBlank() }?.let {
                                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            if (estLaMienne) {
                                Text("Ton école ✓", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                            } else {
                                TextButton(onClick = { viewModel.rejoindre(ecole.id) }, enabled = ui.joiningId == null) { Text("Rejoindre") }
                            }
                        }
                    }
                }
            }
        }
    }
}
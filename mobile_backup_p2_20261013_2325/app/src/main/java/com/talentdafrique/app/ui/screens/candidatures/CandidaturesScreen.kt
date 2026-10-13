package com.talentdafrique.app.ui.screens.candidatures

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.data.remote.dto.StatutCandidature
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import com.talentdafrique.app.ui.components.StatusChip
import com.talentdafrique.app.ui.components.statutCandidatureStyle

private fun iconeStatut(statut: StatutCandidature): ImageVector = when (statut) {
    StatutCandidature.RECUE -> Icons.Filled.MailOutline
    StatutCandidature.EN_COURS -> Icons.Filled.HourglassTop
    StatutCandidature.ENTRETIEN -> Icons.Filled.Groups
    StatutCandidature.REFUSEE -> Icons.Filled.Cancel
    StatutCandidature.ACCEPTEE -> Icons.Filled.CheckCircle
}

@Composable
fun CandidaturesScreen(
    viewModel: CandidaturesViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    when {
        uiState.isLoading -> LoadingView(modifier = Modifier.fillMaxSize())

        uiState.errorMessage != null -> ErrorView(
            message = uiState.errorMessage ?: "",
            onRetry = viewModel::loadCandidatures,
            icon = Icons.Outlined.WifiOff,
        )

        uiState.candidatures.isEmpty() -> EmptyView(
            title = "Aucune candidature envoyée",
            subtitle = "Postule à une offre pour la voir apparaître ici.",
            icon = Icons.Outlined.Assignment,
        )

        else -> LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(uiState.candidatures, key = { it.id }) { candidature ->
                val style = statutCandidatureStyle(candidature.statut)

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                ) {
                    Row(modifier = Modifier.padding(16.dp)) {
                        // Pastille icône de statut — repère visuel immédiat
                        Surface(
                            color = style.color.copy(alpha = 0.14f),
                            shape = CircleShape,
                            modifier = Modifier.size(44.dp),
                        ) {
                            Icon(
                                imageVector = iconeStatut(candidature.statut),
                                contentDescription = null,
                                tint = style.color,
                                modifier = Modifier.padding(11.dp),
                            )
                        }

                        Column(modifier = Modifier.padding(start = 14.dp).fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top,
                            ) {
                                Text(
                                    text = candidature.offre?.titre ?: "Offre",
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.weight(1f).padding(end = 8.dp),
                                    maxLines = 2,
                                )
                            }

                            candidature.offre?.localisation?.let {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(top = 4.dp),
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.LocationOn,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Text(
                                        text = it,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(start = 4.dp),
                                    )
                                }
                            }

                            StatusChip(style = style, modifier = Modifier.padding(top = 10.dp))
                        }
                    }
                }
            }
        }
    }
}
package com.talentdafrique.app.ui.screens.missions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.data.remote.dto.MissionDto
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import com.talentdafrique.app.ui.components.StatusChip
import com.talentdafrique.app.ui.components.StatusStyle
import com.talentdafrique.app.ui.components.formatDate
import com.talentdafrique.app.ui.theme.StatusAcceptee
import com.talentdafrique.app.ui.theme.StatusEnCours
import com.talentdafrique.app.ui.theme.StatusRecue
import com.talentdafrique.app.ui.theme.StatusRefusee
import kotlinx.coroutines.delay

private fun statutMissionStyle(statut: String): StatusStyle = when (statut) {
    "en_cours" -> StatusStyle("En cours", StatusEnCours)
    "en_pause" -> StatusStyle("En pause", StatusRecue)
    "terminee" -> StatusStyle("Terminée", StatusAcceptee)
    "annulee" -> StatusStyle("Annulée", StatusRefusee)
    else -> StatusStyle(statut, StatusRecue)
}

@Composable
fun MissionsScreen(viewModel: MissionsViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.refresh()
        while (true) {
            delay(15_000)
            viewModel.refresh()
        }
    }

    when {
        uiState.isLoading -> LoadingView(modifier = Modifier.fillMaxSize())

        uiState.errorMessage != null -> ErrorView(
            message = uiState.errorMessage ?: "",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )

        uiState.missions.isEmpty() -> EmptyView(
            title = "Aucune mission pour l'instant",
            subtitle = "Une mission apparaît ici quand une entreprise accepte ta candidature sur une offre de type mission.",
            icon = Icons.Outlined.Assignment,
        )

        else -> Column(modifier = Modifier.fillMaxSize()) {
            uiState.actionError?.let { message ->
                Text(
                    text = "$message (toucher pour fermer)",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { viewModel.effacerErreurAction() }
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.missions, key = { it.id }) { mission ->
                    MissionCard(
                        m = mission,
                        onJalon = viewModel::cocherJalon,
                        onStatut = viewModel::changerStatut,
                        onAvancement = viewModel::changerAvancement,
                    )
                }
            }
        }
    }
}

@Composable
private fun MissionCard(
    m: MissionDto,
    onJalon: (String, Boolean) -> Unit,
    onStatut: (String, String) -> Unit,
    onAvancement: (String, Int) -> Unit,
) {
    val cloturee = m.statut == "terminee" || m.statut == "annulee"
    var valeur by remember(m.id, m.avancement) { mutableStateOf(m.avancement.toFloat()) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Text(
                    text = m.titre,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f).padding(end = 8.dp),
                    maxLines = 2,
                )
                StatusChip(style = statutMissionStyle(m.statut))
            }

            Text(
                text = "Offre : ${m.offreTitre}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )

            if (!m.dateDebut.isNullOrBlank() || !m.dateFin.isNullOrBlank()) {
                val debut = formatDate(m.dateDebut).ifBlank { "…" }
                val fin = formatDate(m.dateFin).ifBlank { "…" }
                Text(
                    text = "Du $debut au $fin",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Barre d'avancement
            Box100(fraction = m.avancement.coerceIn(0, 100) / 100f)
            Text(
                text = "${m.avancement} % d'avancement",
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier.padding(top = 4.dp),
            )

            if (m.jalons.isNotEmpty()) {
                Text(
                    text = "Jalons",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 12.dp),
                )
                m.jalons.forEach { j ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = j.fait,
                            onCheckedChange = { onJalon(j.id, it) },
                            enabled = !cloturee,
                        )
                        Column(modifier = Modifier.padding(start = 4.dp)) {
                            Text(text = j.titre, style = MaterialTheme.typography.bodyMedium)
                            if (!j.datePrevue.isNullOrBlank()) {
                                Text(
                                    text = "Prévu le ${formatDate(j.datePrevue)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            } else if (!cloturee) {
                Text(
                    text = "Règle l'avancement",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 12.dp),
                )
                Slider(
                    value = valeur,
                    onValueChange = { valeur = it },
                    valueRange = 0f..100f,
                    onValueChangeFinished = {
                        if (valeur.toInt() != m.avancement) onAvancement(m.id, valeur.toInt())
                    },
                )
            }

            if (!cloturee) {
                OutlinedButton(
                    onClick = { onStatut(m.id, if (m.statut == "en_pause") "en_cours" else "en_pause") },
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                ) {
                    Text(if (m.statut == "en_pause") "Reprendre la mission" else "Mettre en pause")
                }
            }
        }
    }
}

/** Barre de progression simple (evite toute difference de signature entre versions de Material3). */
@Composable
private fun Box100(fraction: Float) {
    androidx.compose.foundation.layout.Box(
        modifier = Modifier
            .padding(top = 12.dp)
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant),
    ) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .fillMaxWidth(fraction)
                .fillMaxHeight()
                .background(MaterialTheme.colorScheme.primary),
        )
    }
}
package com.talentdafrique.app.ui.screens.candidatures

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import com.talentdafrique.app.ui.components.StatusChip
import com.talentdafrique.app.ui.components.statutCandidatureStyle
import com.talentdafrique.app.ui.screens.entretiens.EntretienCard

@Composable
fun CandidatureDetailScreen(
    onOpenMessages: (String) -> Unit,
    onOpenOffre: (String) -> Unit,
    onRetiree: () -> Unit = {},
    viewModel: CandidatureDetailViewModel = hiltViewModel(),
) {
    val ui by viewModel.uiState.collectAsState()
    val c = ui.candidature
    val showRetrait = androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    androidx.compose.runtime.LaunchedEffect(ui.retiree) { if (ui.retiree) onRetiree() }

    when {
        ui.isLoading -> LoadingView()
        ui.errorMessage != null || c == null -> ErrorView(
            message = ui.errorMessage ?: "Candidature introuvable.",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )
        else -> Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        ) {
            Text(c.offre?.titre ?: "Offre", style = MaterialTheme.typography.headlineSmall)
            c.offre?.localisation?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
            StatusChip(style = statutCandidatureStyle(c.statut), modifier = Modifier.padding(top = 12.dp))

            c.message?.takeIf { it.isNotBlank() }?.let {
                Text(
                    "Ton message",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 20.dp),
                )
                Text(it, modifier = Modifier.padding(top = 2.dp))
            }

            Text("Entretiens", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 24.dp))
            if (ui.entretiens.isEmpty()) {
                Text(
                    "Aucun entretien planifié pour l'instant.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            } else {
                ui.entretiens.forEach { EntretienCard(entretien = it, modifier = Modifier.padding(top = 8.dp)) }
            }

            Button(
                onClick = { onOpenMessages(c.id) },
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp).height(48.dp),
            ) { Text("Écrire à l'entreprise") }

            OutlinedButton(
                onClick = { onOpenOffre(c.offreId) },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp).height(48.dp),
            ) { Text("Voir l'offre") }

            if (c.statut != com.talentdafrique.app.data.remote.dto.StatutCandidature.ACCEPTEE) {
                OutlinedButton(
                    onClick = { showRetrait.value = true },
                    enabled = !ui.isRetiring,
                    colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp).height(48.dp),
                ) { Text("Retirer ma candidature") }
            }
            ui.retraitError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp))
            }
            if (showRetrait.value) {
                androidx.compose.material3.AlertDialog(
                    onDismissRequest = { showRetrait.value = false },
                    title = { Text("Retirer ta candidature ?") },
                    text = { Text("Les messages et entretiens liés seront supprimés. Cette action est définitive.") },
                    confirmButton = {
                        androidx.compose.material3.TextButton(onClick = { showRetrait.value = false; viewModel.retirer() }) {
                            Text("Retirer", color = MaterialTheme.colorScheme.error)
                        }
                    },
                    dismissButton = { androidx.compose.material3.TextButton(onClick = { showRetrait.value = false }) { Text("Annuler") } },
                )
            }
        }
    }
}
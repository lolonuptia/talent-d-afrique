package com.talentdafrique.app.ui.screens.compte

import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView

@Composable
fun CompteScreen(viewModel: CompteViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showDeleteDialog by remember { mutableStateOf(false) }

    LaunchedEffect(ui.exportedJson) {
        ui.exportedJson?.let { json ->
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, "Mes données Talent d'Afrique")
                putExtra(Intent.EXTRA_TEXT, json)
            }
            context.startActivity(Intent.createChooser(intent, "Exporter mes données"))
            viewModel.exportConsumed()
        }
    }

    when {
        ui.isLoading -> LoadingView()
        ui.errorMessage != null && ui.user == null -> ErrorView(
            message = ui.errorMessage ?: "",
            onRetry = viewModel::load,
            icon = Icons.Outlined.WifiOff,
        )
        else -> Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        ) {
            Text("Mes informations", style = MaterialTheme.typography.titleMedium)

            OutlinedTextField(
                value = ui.editNom, onValueChange = viewModel::onNomChange,
                label = { Text("Nom") }, singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            )
            OutlinedTextField(
                value = ui.editEmail, onValueChange = viewModel::onEmailChange,
                label = { Text("Email") }, singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 8.dp),
            )

            ui.saveError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp))
            }
            ui.saveMessage?.let {
                Text(it, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp))
            }

            Button(
                onClick = viewModel::save, enabled = !ui.isSaving,
                modifier = Modifier.fillMaxWidth().height(48.dp),
            ) {
                if (ui.isSaving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Text("Enregistrer")
            }

            Divider(modifier = Modifier.padding(vertical = 24.dp))

            Text("Mes données", style = MaterialTheme.typography.titleMedium)
            Text(
                "Tu peux récupérer une copie de toutes les données que nous avons sur toi.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
            )
            ui.exportError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp))
            }
            OutlinedButton(
                onClick = viewModel::export, enabled = !ui.isExporting,
                modifier = Modifier.fillMaxWidth().height(48.dp),
            ) {
                if (ui.isExporting) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Text("Exporter mes données")
            }

            Divider(modifier = Modifier.padding(vertical = 24.dp))

            Text("Zone sensible", style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.error)
            ui.deleteError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp))
            }
            OutlinedButton(
                onClick = { showDeleteDialog = true }, enabled = !ui.isDeleting,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                modifier = Modifier.fillMaxWidth().height(48.dp).padding(top = 0.dp),
            ) { Text("Supprimer mon compte") }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Supprimer ton compte ?") },
            text = { Text("Ton compte sera désactivé immédiatement et tu seras déconnecté.") },
            confirmButton = {
                TextButton(onClick = { showDeleteDialog = false; viewModel.deleteAccount() }) {
                    Text("Supprimer", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Annuler") } },
        )
    }
}
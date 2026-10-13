package com.talentdafrique.app.ui.screens.portfolio

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView

@Composable
fun PortfolioScreen(viewModel: PortfolioViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val uriHandler = LocalUriHandler.current
    var showForm by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        Button(
            onClick = { viewModel.clearFormError(); showForm = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
        ) {
            Icon(Icons.Outlined.Add, contentDescription = null)
            Text("Ajouter un projet", modifier = Modifier.padding(start = 8.dp))
        }

        when {
            ui.isLoading -> LoadingView()
            ui.errorMessage != null -> ErrorView(
                message = ui.errorMessage ?: "",
                onRetry = viewModel::load,
                icon = Icons.Outlined.WifiOff,
            )
            ui.items.isEmpty() -> EmptyView(
                title = "Portfolio vide",
                subtitle = "Présente tes projets : un lien vaut mieux qu'un long discours.",
                icon = Icons.Outlined.Folder,
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(ui.items, key = { it.id }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.titre, style = MaterialTheme.typography.titleSmall)
                                item.description?.takeIf { it.isNotBlank() }?.let {
                                    Text(
                                        it,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(top = 4.dp),
                                    )
                                }
                                item.url?.takeIf { it.startsWith("http") }?.let { link ->
                                    TextButton(onClick = { runCatching { uriHandler.openUri(link) } }) { Text("Ouvrir le lien") }
                                }
                            }
                            IconButton(onClick = { viewModel.delete(item.id) }) {
                                Icon(Icons.Outlined.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showForm) {
        var titre by remember { mutableStateOf("") }
        var description by remember { mutableStateOf("") }
        var url by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showForm = false },
            title = { Text("Nouveau projet") },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    OutlinedTextField(value = titre, onValueChange = { titre = it }, label = { Text("Titre") }, singleLine = true)
                    OutlinedTextField(
                        value = description, onValueChange = { description = it }, label = { Text("Description") },
                        minLines = 2, modifier = Modifier.padding(top = 8.dp),
                    )
                    OutlinedTextField(
                        value = url, onValueChange = { url = it }, label = { Text("Lien (https://...)") }, singleLine = true,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                    ui.formError?.let {
                        Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp))
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = { viewModel.add(titre, description, url) { showForm = false } },
                    enabled = !ui.isSaving,
                ) { Text("Ajouter") }
            },
            dismissButton = { TextButton(onClick = { showForm = false }) { Text("Annuler") } },
        )
    }
}
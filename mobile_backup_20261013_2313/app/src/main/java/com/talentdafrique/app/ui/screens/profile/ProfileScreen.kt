package com.talentdafrique.app.ui.screens.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.data.remote.dto.ProfileDto
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import java.io.File
import java.io.FileOutputStream

private fun libelleDisponibilite(value: String?): String? =
    DisponibiliteOption.entries.find { it.value == value }?.label

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val cvPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val inputStream = context.contentResolver.openInputStream(uri) ?: return@rememberLauncherForActivityResult
        val tempFile = File.createTempFile("cv_", ".pdf", context.cacheDir)
        FileOutputStream(tempFile).use { output -> inputStream.copyTo(output) }
        viewModel.uploadCv(tempFile)
    }

    when {
        uiState.isLoading -> LoadingView(modifier = Modifier.fillMaxSize())

        uiState.errorMessage != null && uiState.user == null -> ErrorView(
            message = uiState.errorMessage ?: "",
            onRetry = viewModel::loadProfile,
            icon = Icons.Outlined.WifiOff,
        )

        else -> Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 24.dp),
        ) {
            // En-tête avatar
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(84.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = uiState.user?.nom?.take(1)?.uppercase() ?: "?",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                        )
                    }
                }
                Text(
                    text = uiState.user?.nom ?: "",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 12.dp),
                )
                Text(
                    text = uiState.user?.email ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            val etudiantProfile = uiState.profile as? ProfileDto.Etudiant

            // Carte CV
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Mon CV", style = MaterialTheme.typography.titleMedium)

                    Text(
                        text = if (etudiantProfile?.cvUrl != null) "CV envoyé ✓" else "Aucun CV envoyé pour l'instant.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (etudiantProfile?.cvUrl != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                    )

                    uiState.cvUploadError?.let { message ->
                        Text(text = message, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 8.dp))
                    }

                    OutlinedButton(
                        onClick = { cvPickerLauncher.launch("application/pdf") },
                        enabled = !uiState.isUploadingCv,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (uiState.isUploadingCv) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp))
                        } else {
                            Text(if (etudiantProfile?.cvUrl != null) "Remplacer mon CV" else "Envoyer mon CV")
                        }
                    }
                }
            }

            // Carte profil — éditable
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(text = "Mon profil", style = MaterialTheme.typography.titleMedium)
                        if (!uiState.isEditing) {
                            IconButton(onClick = viewModel::startEditing) {
                                Icon(
                                    imageVector = Icons.Outlined.Edit,
                                    contentDescription = "Modifier mon profil",
                                    tint = MaterialTheme.colorScheme.primary,
                                )
                            }
                        }
                    }

                    if (uiState.isEditing) {
                        OutlinedTextField(
                            value = uiState.editCompetences,
                            onValueChange = viewModel::onEditCompetencesChange,
                            label = { Text("Compétences") },
                            placeholder = { Text("Ex: Kotlin, React, gestion de projet...") },
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
                            minLines = 2,
                        )

                        Text(
                            text = "Disponibilité",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 16.dp, bottom = 8.dp),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            DisponibiliteOption.entries.take(2).forEach { option ->
                                FilterChip(
                                    selected = uiState.editDisponibilite == option,
                                    onClick = { viewModel.onEditDisponibiliteSelected(option) },
                                    label = { Text(option.label) },
                                )
                            }
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(top = 8.dp),
                        ) {
                            DisponibiliteOption.entries.drop(2).forEach { option ->
                                FilterChip(
                                    selected = uiState.editDisponibilite == option,
                                    onClick = { viewModel.onEditDisponibiliteSelected(option) },
                                    label = { Text(option.label) },
                                )
                            }
                        }

                        uiState.saveError?.let { message ->
                            Text(
                                text = message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(top = 10.dp),
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            OutlinedButton(
                                onClick = viewModel::cancelEditing,
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f),
                            ) {
                                Text("Annuler")
                            }
                            androidx.compose.material3.Button(
                                onClick = viewModel::saveProfile,
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f),
                            ) {
                                if (uiState.isSaving) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                } else {
                                    Text("Enregistrer")
                                }
                            }
                        }
                    } else {
                        if (!etudiantProfile?.competences.isNullOrBlank()) {
                            Text(
                                text = "Compétences",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 12.dp),
                            )
                            Text(text = etudiantProfile?.competences ?: "", modifier = Modifier.padding(top = 2.dp))
                        }

                        libelleDisponibilite(etudiantProfile?.disponibilite)?.let { label ->
                            Text(
                                text = "Disponibilité",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 12.dp),
                            )
                            Text(text = label, modifier = Modifier.padding(top = 2.dp))
                        }

                        if (etudiantProfile?.competences.isNullOrBlank() && libelleDisponibilite(etudiantProfile?.disponibilite) == null) {
                            Text(
                                text = "Complète ton profil pour de meilleures recommandations.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                        }
                    }
                }
            }

            Divider(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp),
                color = MaterialTheme.colorScheme.outlineVariant,
            )

            OutlinedButton(
                onClick = viewModel::logout,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f)),
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .padding(horizontal = 20.dp),
            ) {
                Icon(imageVector = Icons.AutoMirrored.Outlined.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                Text(text = "Se déconnecter", modifier = Modifier.padding(start = 8.dp))
            }
        }
    }
}
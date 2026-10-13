package com.talentdafrique.app.ui.screens.offres

import com.talentdafrique.app.ui.components.formatMontant

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.ui.theme.ScoreHigh
import com.talentdafrique.app.ui.theme.ScoreLow
import com.talentdafrique.app.ui.theme.ScoreMedium

private val criteres = listOf(
    "competences_obligatoires" to "Compétences requises",
    "competences_souhaitees" to "Compétences souhaitées",
    "experience" to "Expérience",
    "disponibilite" to "Disponibilité",
    "soft_skills" to "Soft skills",
)

private fun couleur(v: Double): Color = when {
    v >= 70.0 -> ScoreHigh
    v >= 40.0 -> ScoreMedium
    else -> ScoreLow
}

private fun libelleDispo(v: String?): String? = when (v) {
    "immediate" -> "Immédiate"
    "1_mois" -> "Sous 1 mois"
    "3_mois" -> "Sous 3 mois"
    "6_mois" -> "Sous 6 mois"
    else -> v
}

@Composable
fun ScoreDetailCard(detail: Map<String, Double>) {
    Column(modifier = Modifier.fillMaxWidth().padding(top = 24.dp)) {
        Text("Pourquoi ce score ?", style = MaterialTheme.typography.titleMedium)
        criteres.forEach { (cle, label) ->
            val v = detail[cle] ?: return@forEach
            Column(modifier = Modifier.padding(top = 12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(label, style = MaterialTheme.typography.bodyMedium)
                    Text("${v.toInt()}%", style = MaterialTheme.typography.labelLarge, color = couleur(v))
                }
                LinearProgressIndicator(
                    progress = { (v / 100.0).toFloat().coerceIn(0f, 1f) },
                    color = couleur(v),
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                )
            }
        }
        Text(
            text = "Hors missions, l'expérience n'entre pas dans le score global d'un étudiant.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}

@Composable
fun OffreInfosCard(offre: OffreDto) {
    val lignes = listOfNotNull(
        offre.niveauExperience?.takeIf { it.isNotBlank() }?.let { "Niveau d'expérience" to it },
        libelleDispo(offre.disponibilite)?.let { "Disponibilité demandée" to it },
        offre.budgetTjm?.let { "Budget TJM" to (formatMontant(it) + " / jour") },
    )
    if (lignes.isEmpty()) return
    Column(modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) {
        Text("Informations", style = MaterialTheme.typography.titleMedium)
        lignes.forEach { (label, valeur) ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(valeur, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun CandidatureMessageDialog(onDismiss: () -> Unit, onConfirm: (String?) -> Unit) {
    var message by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Postuler à cette offre") },
        text = {
            OutlinedTextField(
                value = message,
                onValueChange = { if (it.length <= 2000) message = it },
                label = { Text("Message (facultatif)") },
                placeholder = { Text("Présente-toi en quelques lignes...") },
                minLines = 3,
            )
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(message.trim().ifBlank { null }) }) { Text("Envoyer") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } },
    )
}
package com.talentdafrique.app.ui.screens.entretiens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.talentdafrique.app.data.remote.dto.EntretienDto
import com.talentdafrique.app.ui.components.formatDateHeure
import com.talentdafrique.app.ui.components.libelleMode
import com.talentdafrique.app.ui.components.libelleStatutEntretien

@Composable
fun EntretienCard(
    entretien: EntretienDto,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val click = if (onClick != null) Modifier.clickable { onClick() } else Modifier
    Card(
        modifier = modifier.fillMaxWidth().then(click),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(formatDateHeure(entretien.dateHeure), style = MaterialTheme.typography.titleSmall)
            Text(
                text = "${entretien.dureeMinutes} min · ${libelleMode(entretien.mode)} · ${libelleStatutEntretien(entretien.statut)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 2.dp),
            )
            entretien.lieuOuLien?.takeIf { it.isNotBlank() }?.let {
                Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
            }
            entretien.message?.takeIf { it.isNotBlank() }?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
    }
}
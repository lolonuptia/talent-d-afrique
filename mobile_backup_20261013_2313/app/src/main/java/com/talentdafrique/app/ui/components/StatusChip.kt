package com.talentdafrique.app.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.talentdafrique.app.data.remote.dto.StatutCandidature
import com.talentdafrique.app.ui.theme.StatusAcceptee
import com.talentdafrique.app.ui.theme.StatusEnCours
import com.talentdafrique.app.ui.theme.StatusEntretien
import com.talentdafrique.app.ui.theme.StatusRecue
import com.talentdafrique.app.ui.theme.StatusRefusee

data class StatusStyle(val label: String, val color: Color)

fun statutCandidatureStyle(statut: StatutCandidature): StatusStyle = when (statut) {
    StatutCandidature.RECUE -> StatusStyle("Reçue", StatusRecue)
    StatutCandidature.EN_COURS -> StatusStyle("En cours", StatusEnCours)
    StatutCandidature.ENTRETIEN -> StatusStyle("Entretien", StatusEntretien)
    StatutCandidature.REFUSEE -> StatusStyle("Refusée", StatusRefusee)
    StatutCandidature.ACCEPTEE -> StatusStyle("Acceptée", StatusAcceptee)
}

@Composable
fun StatusChip(style: StatusStyle, modifier: Modifier = Modifier) {
    Surface(
        color = style.color.copy(alpha = 0.14f),
        contentColor = style.color,
        shape = MaterialTheme.shapes.extraSmall,
        modifier = modifier,
    ) {
        Text(
            text = style.label,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
        )
    }
}
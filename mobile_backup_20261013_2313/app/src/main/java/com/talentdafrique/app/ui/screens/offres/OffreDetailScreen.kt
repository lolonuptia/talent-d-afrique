package com.talentdafrique.app.ui.screens.offres


import androidx.compose.foundation.background

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding

import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.remote.dto.TypeContrat
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.theme.Forest20
import com.talentdafrique.app.ui.theme.Forest40
import com.talentdafrique.app.ui.theme.ScoreHigh
import com.talentdafrique.app.ui.theme.ScoreLow
import com.talentdafrique.app.ui.theme.ScoreMedium

private fun libelleContrat(type: TypeContrat): String = when (type) {
    TypeContrat.STAGE -> "Stage"
    TypeContrat.CDD -> "CDD"
    TypeContrat.CDI -> "CDI"
    TypeContrat.MISSION -> "Mission"
}

private fun couleurScore(score: Double): Color = when {
    score >= 0.7 -> ScoreHigh
    score >= 0.4 -> ScoreMedium
    else -> ScoreLow
}

@Composable
fun OffreDetailScreen(
    onCandidatureEnvoyee: () -> Unit = {},
    viewModel: OffreDetailViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.candidatureEnvoyee) {
        if (uiState.candidatureEnvoyee) onCandidatureEnvoyee()
    }

    when {
        uiState.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }

        uiState.errorMessage != null -> ErrorView(
            message = uiState.errorMessage ?: "",
            onRetry = viewModel::loadOffre,
            icon = Icons.Outlined.WifiOff,
        )

        uiState.offre != null -> {
            val offre = uiState.offre!!

            Column(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                ) {
                    // Bandeau titre — cohérent avec l'identité visuelle de l'app
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                            .background(Brush.linearGradient(colors = listOf(Forest40, Forest20)))
                            .padding(horizontal = 24.dp, vertical = 28.dp),
                    ) {
                        Column {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(
                                    color = Color.White.copy(alpha = 0.18f),
                                    shape = MaterialTheme.shapes.extraSmall,
                                ) {
                                    Text(
                                        text = libelleContrat(offre.typeContrat),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    )
                                }

                                offre.scoreGlobal?.let { score ->
                                    Surface(
                                        color = Color.White.copy(alpha = 0.18f),
                                        shape = MaterialTheme.shapes.extraSmall,
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                        ) {
                                            Icon(
                                                imageVector = Icons.Filled.Star,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.height(14.dp),
                                            )
                                            Text(
                                                text = "${(score * 100).toInt()}% match",
                                                style = MaterialTheme.typography.labelMedium,
                                                color = Color.White,
                                                modifier = Modifier.padding(start = 4.dp),
                                            )
                                        }
                                    }
                                }
                            }

                            Text(
                                text = offre.titre,
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 16.dp),
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(top = 12.dp),
                            ) {
                                offre.localisation?.let {
                                    Icon(
                                        imageVector = Icons.Outlined.LocationOn,
                                        contentDescription = null,
                                        tint = Color.White.copy(alpha = 0.85f),
                                        modifier = Modifier.height(16.dp),
                                    )
                                    Text(
                                        text = it,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color.White.copy(alpha = 0.85f),
                                        modifier = Modifier.padding(start = 4.dp),
                                    )
                                }

                                offre.remuneration?.let {
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Icon(
                                        imageVector = Icons.Outlined.Payments,
                                        contentDescription = null,
                                        tint = Color.White.copy(alpha = 0.85f),
                                        modifier = Modifier.height(16.dp),
                                    )
                                    Text(
                                        text = "$it €",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color.White.copy(alpha = 0.85f),
                                        modifier = Modifier.padding(start = 4.dp),
                                    )
                                }
                            }
                        }
                    }

                    Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 24.dp)) {
                        SectionTitle("Description")
                        Text(
                            text = offre.description ?: "Aucune description fournie.",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(top = 8.dp),
                        )

                        offre.competencesObligatoires?.let {
                            SectionTitle("Compétences requises", topPadding = 24.dp)
                            Text(text = it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
                        }

                        offre.competencesSouhaitees?.let {
                            SectionTitle("Compétences souhaitées", topPadding = 20.dp)
                            Text(text = it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
                        }

                        offre.softSkills?.let {
                            SectionTitle("Soft skills", topPadding = 20.dp)
                            Text(text = it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
                        }

                        // Marge basse pour ne pas être masqué par le bouton fixe
                        Spacer(modifier = Modifier.height(80.dp))
                    }
                }

                // Barre d'action fixe — toujours accessible sans avoir à scroller
                Surface(
                    tonalElevation = 4.dp,
                    shadowElevation = 8.dp,
                ) {
                    Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
                        uiState.postulerError?.let { message ->
                            Text(
                                text = message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(bottom = 8.dp),
                            )
                        }

                        Button(
                            onClick = { viewModel.postuler() },
                            enabled = !uiState.isPostulating && !uiState.candidatureEnvoyee,
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            when {
                                uiState.isPostulating -> CircularProgressIndicator(
                                    modifier = Modifier.height(22.dp),
                                    strokeWidth = 2.5.dp,
                                )
                                uiState.candidatureEnvoyee -> Text("Candidature envoyée ✓", style = MaterialTheme.typography.titleSmall)
                                else -> Text("Postuler", style = MaterialTheme.typography.titleSmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(text: String, topPadding: androidx.compose.ui.unit.Dp = 0.dp) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        modifier = Modifier.padding(top = topPadding),
    )
}
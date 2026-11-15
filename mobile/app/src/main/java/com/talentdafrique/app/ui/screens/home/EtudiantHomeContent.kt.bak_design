package com.talentdafrique.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.ui.components.EmptyView
import com.talentdafrique.app.ui.components.ErrorView
import com.talentdafrique.app.ui.components.LoadingView
import com.talentdafrique.app.ui.screens.offres.OffreCard
import com.talentdafrique.app.ui.theme.Forest20
import com.talentdafrique.app.ui.theme.Forest40
import com.talentdafrique.app.ui.theme.HeroShape
import java.util.Calendar

private fun greeting(): String {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when {
        hour < 5 -> "Bonne nuit"
        hour < 12 -> "Bonjour"
        hour < 18 -> "Bon après-midi"
        else -> "Bonsoir"
    }
}

@Composable
fun EtudiantHomeContent(
    onOffreClick: (String) -> Unit,
    onSeeAllClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: EtudiantHomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    when {
        uiState.isLoading -> LoadingView(modifier = modifier.fillMaxSize())

        uiState.errorMessage != null -> ErrorView(
            message = uiState.errorMessage ?: "",
            onRetry = viewModel::loadOffresRecommandees,
            icon = Icons.Outlined.WifiOff,
        )

        else -> LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 32.dp),
        ) {
            item { HomeHero(offresCount = uiState.offres.size) }

            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .padding(top = 20.dp, bottom = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(text = "Recommandées pour toi", style = MaterialTheme.typography.titleLarge)
                        Text(
                            text = "Classées par pertinence",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    TextButton(onClick = onSeeAllClick) { Text("Tout voir") }
                }
            }

            if (uiState.offres.isEmpty()) {
                item {
                    EmptyView(
                        title = "Pas encore de recommandations",
                        subtitle = "Complète ton profil et ton CV pour recevoir des offres adaptées.",
                        icon = Icons.Outlined.SearchOff,
                        modifier = Modifier.size(height = 320.dp, width = 0.dp).fillMaxWidth(),
                    )
                }
            } else {
                items(uiState.offres, key = { it.id }) { offre ->
                    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)) {
                        OffreCard(offre = offre, onClick = { onOffreClick(offre.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeHero(offresCount: Int) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HeroShape)
            .background(Brush.linearGradient(colors = listOf(Forest40, Forest20))),
    ) {
        // Motif décoratif discret : deux cercles en fond, évoquant un soleil/motif graphique
        Box(
            modifier = Modifier
                .size(180.dp)
                .align(Alignment.TopEnd)
                .offset(x = 40.dp, y = (-60).dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.06f)),
        )
        Box(
            modifier = Modifier
                .size(90.dp)
                .align(Alignment.CenterEnd)
                .offset(x = 12.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.05f)),
        )

        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.WavingHand,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(22.dp),
                )
                Text(
                    text = "${greeting()} !",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    modifier = Modifier.padding(start = 8.dp),
                )
            }

            Text(
                text = "Voici les offres qui te correspondent le mieux",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.88f),
                modifier = Modifier.padding(top = 6.dp, bottom = 20.dp),
            )

            if (offresCount > 0) {
                Surface(
                    color = Color.White.copy(alpha = 0.16f),
                    shape = MaterialTheme.shapes.small,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Star,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp),
                        )
                        Text(
                            text = "$offresCount offre${if (offresCount > 1) "s" else ""} sélectionnée${if (offresCount > 1) "s" else ""} pour toi",
                            style = MaterialTheme.typography.labelLarge,
                            color = Color.White,
                            modifier = Modifier.padding(start = 8.dp),
                        )
                    }
                }
            }
        }
    }
}
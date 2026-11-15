package com.talentdafrique.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.talentdafrique.app.data.remote.dto.StatutCandidature

/** Anneau de score (0-100) avec la valeur au centre. */
@Composable
fun ScoreRing(
    score: Double,
    color: Color,
    modifier: Modifier = Modifier,
    diameter: Dp = 48.dp,
) {
    val track = MaterialTheme.colorScheme.surfaceVariant
    val fraction = (score.toFloat() / 100f).coerceIn(0f, 1f)
    Box(modifier = modifier.size(diameter), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 5.dp.toPx()
            val topLeft = Offset(stroke / 2f, stroke / 2f)
            val arcSize = Size(this.size.width - stroke, this.size.height - stroke)
            drawArc(
                color = track, startAngle = 0f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize, style = Stroke(width = stroke),
            )
            drawArc(
                color = color, startAngle = -90f, sweepAngle = 360f * fraction, useCenter = false,
                topLeft = topLeft, size = arcSize, style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
        }
        Text(
            text = "${score.toInt()}",
            style = MaterialTheme.typography.labelMedium,
            color = color,
        )
    }
}

@Composable
fun shimmerBrush(): Brush {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val x by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1200f,
        animationSpec = infiniteRepeatable(tween(1100, easing = LinearEasing)),
        label = "shimmerX",
    )
    val base = MaterialTheme.colorScheme.surfaceVariant
    return Brush.linearGradient(
        colors = listOf(base.copy(alpha = 0.55f), base, base.copy(alpha = 0.55f)),
        start = Offset(x - 400f, 0f),
        end = Offset(x, 0f),
    )
}

/** Squelettes de cartes affichés pendant le chargement. */
@Composable
fun SkeletonList(modifier: Modifier = Modifier, count: Int = 5) {
    val brush = shimmerBrush()
    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        repeat(count) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(104.dp)
                    .clip(MaterialTheme.shapes.large)
                    .background(brush),
            )
        }
    }
}

/** Frise en 4 segments : reçue, en cours, entretien, décision. */
@Composable
fun CandidatureProgress(
    statut: StatutCandidature,
    color: Color,
    modifier: Modifier = Modifier,
) {
    val etape = when (statut) {
        StatutCandidature.RECUE -> 1
        StatutCandidature.EN_COURS -> 2
        StatutCandidature.ENTRETIEN -> 3
        StatutCandidature.ACCEPTEE, StatutCandidature.REFUSEE -> 4
    }
    val vide = MaterialTheme.colorScheme.surfaceVariant
    Row(
        modifier = modifier.fillMaxWidth().padding(top = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        repeat(4) { i ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(if (i < etape) color else vide),
            )
        }
    }
}
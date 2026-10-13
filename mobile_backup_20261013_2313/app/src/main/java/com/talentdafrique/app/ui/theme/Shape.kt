package com.talentdafrique.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val TalentShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp),
)

/** Forme signature pour les éléments "hero" (bandeau d'accueil) — un coin
 * bas très adouci, l'autre discret, pour casser la symétrie M3 par défaut
 * et donner une identité visuelle propre à l'app plutôt qu'un look générique. */
val HeroShape = RoundedCornerShape(
    topStart = 0.dp,
    topEnd = 0.dp,
    bottomStart = 44.dp,
    bottomEnd = 16.dp,
)
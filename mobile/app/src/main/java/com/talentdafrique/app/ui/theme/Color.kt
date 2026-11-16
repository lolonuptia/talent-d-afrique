package com.talentdafrique.app.ui.theme

import androidx.compose.ui.graphics.Color

// Palette alignee sur le web : bleu #1565D8 / marine #0A3D8F / orange #F7941D.
// Les noms (Forest*, Terracotta*) sont conserves pour ne pas casser le code :
// Forest* = bleu de marque (primaire), Terracotta* = orange de marque (secondaire).

val BrandBlue = Color(0xFF1565D8)
val BrandNavy = Color(0xFF0A3D8F)
val BrandGold = Color(0xFFF7941D)

// Bleu (primaire)
val Forest10 = Color(0xFF001A41)
val Forest20 = Color(0xFF062E6F)
val Forest30 = Color(0xFF0A3D8F)
val Forest40 = Color(0xFF1565D8)
val Forest80 = Color(0xFF9DBFFF)
val Forest90 = Color(0xFFD6E3FF)
val Forest95 = Color(0xFFEAF1FF)
val Forest99 = Color(0xFFF8FAFF)

// Orange (secondaire)
val Terracotta10 = Color(0xFF2A1A00)
val Terracotta20 = Color(0xFF462A00)
val Terracotta30 = Color(0xFF6A3F00)
val Terracotta40 = Color(0xFFE07B00)
val Terracotta80 = Color(0xFFFFB866)
val Terracotta90 = Color(0xFFFFDDB8)
val Terracotta95 = Color(0xFFFFF4E5)

// Tertiaire (statut "entretien", accents)
val Indigo40 = Color(0xFF3E5FC7)
val Indigo80 = Color(0xFFB7C4FF)
val Indigo90 = Color(0xFFDEE1FF)

// Neutres (teinte bleutee comme le web)
val Neutral10 = Color(0xFF0E1A2E)
val Neutral90 = Color(0xFFE8EEF8)
val Neutral95 = Color(0xFFEEF3FB)
val Neutral99 = Color(0xFFF7F9FD)
val NeutralVariant30 = Color(0xFF5F7090)
val NeutralVariant60 = Color(0xFF94A3B8)
val NeutralVariant80 = Color(0xFFD9E2EF)

val Error40 = Color(0xFFDC2626)
val Error80 = Color(0xFFF87171)
val Error90 = Color(0xFFFEE2E2)
val Error10 = Color(0xFF450A0A)

// Couleurs semantiques de score/statut : fixes, independantes du theme.
val ScoreHigh = Color(0xFF1D6B3C)
val ScoreMedium = Color(0xFFE07B00)
val ScoreLow = Color(0xFF94A3B8)

val StatusRecue = Color(0xFF64748B)
val StatusEnCours = Color(0xFFE07B00)
val StatusEntretien = Color(0xFF3E5FC7)
val StatusRefusee = Color(0xFFDC2626)
val StatusAcceptee = Color(0xFF1D6B3C)
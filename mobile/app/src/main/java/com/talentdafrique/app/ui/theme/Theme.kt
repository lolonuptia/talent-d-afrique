package com.talentdafrique.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = Forest40,
    onPrimary = Color.White,
    primaryContainer = Forest95,
    onPrimaryContainer = Forest10,
    secondary = Terracotta40,
    onSecondary = Color.White,
    secondaryContainer = Terracotta90,
    onSecondaryContainer = Terracotta10,
    tertiary = Indigo40,
    onTertiary = Color.White,
    tertiaryContainer = Indigo90,
    onTertiaryContainer = Color(0xFF00174B),
    background = Neutral99,
    onBackground = Neutral10,
    surface = Color.White,
    onSurface = Neutral10,
    surfaceVariant = Neutral95,
    onSurfaceVariant = NeutralVariant30,
    outline = NeutralVariant60,
    outlineVariant = NeutralVariant80,
    error = Error40,
    onError = Color.White,
    errorContainer = Error90,
    onErrorContainer = Error10,
)

private val DarkColors = darkColorScheme(
    primary = Forest80,
    onPrimary = Forest20,
    primaryContainer = Forest30,
    onPrimaryContainer = Forest90,
    secondary = Terracotta80,
    onSecondary = Terracotta20,
    secondaryContainer = Terracotta30,
    onSecondaryContainer = Terracotta90,
    tertiary = Indigo80,
    onTertiary = Color(0xFF00237B),
    tertiaryContainer = Color(0xFF213592),
    onTertiaryContainer = Indigo90,
    background = Color(0xFF0A1424),
    onBackground = Neutral90,
    surface = Color(0xFF0F1B2D),
    onSurface = Neutral90,
    surfaceVariant = Color(0xFF152540),
    onSurfaceVariant = Color(0xFF93A6C4),
    outline = Color(0xFF5F7090),
    outlineVariant = Color(0xFF24344F),
    error = Error80,
    onError = Color(0xFF690003),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Error90,
)

@Composable
fun TalentDAfriqueTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TalentTypography,
        shapes = TalentShapes,
        content = content,
    )
}
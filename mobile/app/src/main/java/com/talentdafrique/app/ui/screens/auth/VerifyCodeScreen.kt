package com.talentdafrique.app.ui.screens.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.talentdafrique.app.R
import com.talentdafrique.app.ui.theme.Forest20
import com.talentdafrique.app.ui.theme.Forest40

@Composable
fun VerifyCodeScreen(
    onVerified: () -> Unit,
    onLogout: () -> Unit,
    viewModel: VerifyCodeViewModel = hiltViewModel(),
) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(ui.verified) { if (ui.verified) onVerified() }

    if (ui.wrongRole) {
        WrongRoleScreen(onLogout = { viewModel.logout(onLogout) })
        return
    }

    if (ui.checking || ui.verified) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(bottomStart = 40.dp, bottomEnd = 40.dp))
                .background(Brush.linearGradient(colors = listOf(Forest40, Forest20))),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Surface(shape = RoundedCornerShape(20.dp), color = Color.White, modifier = Modifier.size(72.dp)) {
                    Image(
                        painter = painterResource(R.drawable.logo_mark),
                        contentDescription = "TIBA",
                        modifier = Modifier.fillMaxSize().padding(10.dp),
                    )
                }
                Text(
                    text = "Vérifie ton email",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    modifier = Modifier.padding(top = 14.dp),
                )
            }
        }

        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 28.dp)) {
            if (ui.loadFailed) {
                Text(
                    text = ui.errorMessage ?: "Connexion impossible.",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Button(
                    onClick = viewModel::check,
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp).height(52.dp),
                ) { Text("Réessayer") }
            } else {
                Text(
                    text = "Nous avons envoyé un code à 6 chiffres à",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    text = ui.email,
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 24.dp),
                )

                CodeField(value = ui.code, onChange = viewModel::onCode, enabled = !ui.isLoading)

                ui.errorMessage?.let { message ->
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    ) {
                        Text(
                            text = message,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        )
                    }
                }
                ui.message?.let { message ->
                    Text(
                        text = message,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    )
                }

                Button(
                    onClick = viewModel::verify,
                    enabled = ui.code.length == 6 && !ui.isLoading,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth().height(52.dp).padding(top = 0.dp),
                ) {
                    if (ui.isLoading) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.5.dp)
                    else Text("Valider", style = MaterialTheme.typography.titleSmall)
                }

                TextButton(
                    onClick = viewModel::resend,
                    enabled = ui.resendIn == 0,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                ) {
                    Text(if (ui.resendIn > 0) "Renvoyer le code (${ui.resendIn} s)" else "Renvoyer le code")
                }
                Text(
                    text = "Pense à regarder les courriers indésirables.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            TextButton(
                onClick = { viewModel.logout(onLogout) },
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            ) { Text("Changer de compte") }
        }
    }
}

@Composable
private fun CodeField(value: String, onChange: (String) -> Unit, enabled: Boolean) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }
    val primary = MaterialTheme.colorScheme.primary
    val outline = MaterialTheme.colorScheme.outline

    BasicTextField(
        value = value,
        onValueChange = onChange,
        enabled = enabled,
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        modifier = Modifier.focusRequester(focus),
        decorationBox = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp).clickable { focus.requestFocus() },
            ) {
                repeat(6) { i ->
                    val actif = i == value.length
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(58.dp)
                            .border(
                                width = if (actif) 2.dp else 1.dp,
                                color = if (actif) primary else outline,
                                shape = MaterialTheme.shapes.small,
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = value.getOrNull(i)?.toString() ?: "",
                            style = MaterialTheme.typography.headlineSmall,
                        )
                    }
                }
            }
        },
    )
    Box(Modifier.height(16.dp))
}